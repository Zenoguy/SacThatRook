'use strict';
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { ParsedGame, ChessComGame } from '@/types/chess';
import { fetchPlayerArchives, fetchMonthlyGames } from '@/services/chesscom';

interface UsePgnWorkerReturn {
  games: ParsedGame[];
  analytics: any | null;
  progress: number;
  progressMessage: string;
  currentTier: number;
  isProcessing: boolean;
  isLoadingArchives: boolean;
  error: string | null;
  startTelemetry: (forceRefresh?: boolean) => Promise<void>;
  hasLoaded: boolean;
}

export function usePgnWorker(username: string): UsePgnWorkerReturn {
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [currentTier, setCurrentTier] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  // Helper to parse archive URL for formatting
  const formatArchiveName = (url: string): string => {
    const match = url.match(/\/games\/(\d{4})\/(\d{2})$/);
    if (match) {
      const year = match[1];
      const monthIndex = parseInt(match[2], 10) - 1;
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${months[monthIndex]} ${year}`;
    }
    return 'Archive';
  };

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Try to load cached data on mount
  useEffect(() => {
    async function loadCachedData() {
      if (!username) return;
      const cleanUser = username.trim().toLowerCase();
      try {
        const cachedGames = await db.games
          .where('username')
          .equals(cleanUser)
          .sortBy('endTime');
        const cachedAnalytics = await db.analytics
          .where('username')
          .equals(cleanUser)
          .first();

        if (cachedGames.length > 0 && cachedAnalytics) {
          setGames(cachedGames.map(cg => cg.gameData));
          setAnalytics(cachedAnalytics.data);
          setHasLoaded(true);
          setCurrentTier(4);
          setProgress(100);
          setProgressMessage('Telemetry loaded from local cache.');
        }
      } catch (err) {
        console.error('Error loading cached telemetry:', err);
      }
    }
    loadCachedData();
  }, [username]);

  const startTelemetry = useCallback(async (forceRefresh = false) => {
    if (!username) return;
    
    setIsLoadingArchives(true);
    setProgress(0);
    setProgressMessage('Initializing telemetry engine...');
    setError(null);
    setHasLoaded(false);
    setCurrentTier(1);

    const cleanUser = username.trim().toLowerCase();

    try {
      // Step 1: Handle forceRefresh cache clearing
      if (forceRefresh) {
        setProgressMessage('Clearing local cache databases...');
        await Promise.all([
          db.games.where('username').equals(cleanUser).delete(),
          db.archives.where('username').equals(cleanUser).delete(),
          db.analytics.where('username').equals(cleanUser).delete()
        ]);
        setGames([]);
        setAnalytics(null);
      }

      // Step 2: Fetch Monthly Archives list from Chess.com
      setProgressMessage('Fetching historical archives index...');
      const archives = await fetchPlayerArchives(cleanUser, forceRefresh);
      if (archives.length === 0) {
        setIsLoadingArchives(false);
        setError('No historical games found for this player.');
        return;
      }

      // Step 3: Determine which archives to fetch
      const processedArchives = await db.archives
        .where('username')
        .equals(cleanUser)
        .toArray();
      const processedUrls = new Set(processedArchives.map(a => a.url));

      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
      const currentMonthSuffix = `${currentYear}/${currentMonth}`;

      const archivesToFetch: string[] = [];
      for (const url of archives) {
        const isCurrentMonth = url.endsWith(currentMonthSuffix);
        if (!processedUrls.has(url) || isCurrentMonth) {
          archivesToFetch.push(url);
        }
      }

      // Step 4: Sequentially fetch games of missing archives
      const rawGamesList: ChessComGame[] = [];
      let fetchedCount = 0;

      setIsLoadingArchives(false);
      setIsProcessing(true);

      for (const url of archivesToFetch) {
        const isCurrentMonth = url.endsWith(currentMonthSuffix);
        setProgressMessage(`SCANNING ${formatArchiveName(url).toUpperCase()} (${fetchedCount + 1}/${archivesToFetch.length})`);
        
        try {
          const rawGames = await fetchMonthlyGames(url, forceRefresh || isCurrentMonth);
          rawGamesList.push(...rawGames);
          fetchedCount++;
          
          // Small delay to prevent 429 requests
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (fetchErr) {
          console.error(`Failed to fetch archive: ${url}`, fetchErr);
        }
      }

      // Step 5: Spawn Worker for Parsing & Analytics
      const worker = new Worker(
        new URL('../workers/pgnWorker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      // Helper function to handle parsing of new games if any
      const runAnalyticsStage = async (gamesToAnalyze: ParsedGame[]) => {
        // Run full analytical calculations in worker
        worker.postMessage({
          type: 'COMPUTE_ANALYTICS',
          games: gamesToAnalyze,
          username: cleanUser
        });
      };

      if (rawGamesList.length > 0) {
        setProgressMessage('PARSING INGESTED GAMES CHUNKS...');
        worker.postMessage({
          type: 'PARSE_CHUNKS',
          games: rawGamesList,
          username: cleanUser
        });

        worker.onmessage = async (e: MessageEvent) => {
          const { type, progress: p, error: err, parsedGames, stage, analytics: computedAnalytics } = e.data;

          if (type === 'PROGRESS') {
            setProgress(Math.round(p * 0.4)); // First 40% of bar is parsing
          } else if (type === 'COMPLETE') {
            setProgress(40);
            setProgressMessage('SAVING DATA TO LOCAL ENGINE...');
            
            // Save parsed games to IndexedDB cache
            try {
              const dbRecords = parsedGames.map((g: ParsedGame) => ({
                uuid: g.uuid,
                username: cleanUser,
                gameData: g,
                endTime: g.endTime
              }));
              await db.games.bulkPut(dbRecords);

              // Mark fetched archives as processed in DB (except current month)
              for (const url of archivesToFetch) {
                if (!url.endsWith(currentMonthSuffix)) {
                  await db.archives.put({
                    url,
                    username: cleanUser,
                    fetchedAt: Date.now()
                  });
                }
              }
            } catch (dbErr) {
              console.error('Error saving parsed games:', dbErr);
            }

            // Fetch ALL games for this user from DB to run full analytics
            const allParsed = await db.games
              .where('username')
              .equals(cleanUser)
              .sortBy('endTime');
            
            const gamesList = allParsed.map(cg => cg.gameData);
            setGames(gamesList);
            
            // Trigger analytics calculations
            await runAnalyticsStage(gamesList);

          } else if (type === 'STAGE') {
            // Stage transitions inside analytics pipeline
            setProgressMessage(stage);
            setProgress(Math.round(40 + (p * 0.6))); // Scaled 40%-100%
            
            // Unlock tiers progressively
            if (stage === 'PROCESSING OPENING DNA') {
              setCurrentTier(2);
            } else if (stage === 'COMPUTING TILT METRICS') {
              setCurrentTier(3);
            } else if (stage === 'REPERTOIRE INTELLIGENCE UPDATED') {
              setCurrentTier(4);
            }
          } else if (type === 'ANALYTICS_COMPLETE') {
            // Finished!
            setProgress(100);
            setProgressMessage('FULL LONGITUDINAL TELEMETRY PROCESSED');
            setIsProcessing(false);
            setAnalytics(computedAnalytics);
            setCurrentTier(4);
            setHasLoaded(true);

            // Fetch and set games state
            const allParsed = await db.games
              .where('username')
              .equals(cleanUser)
              .sortBy('endTime');
            setGames(allParsed.map(cg => cg.gameData));

            // Save computed analytics to Dexie DB
            try {
              await db.analytics.put({
                username: cleanUser,
                computedAt: Date.now(),
                data: computedAnalytics
              });
            } catch (dbErr) {
              console.error('Error saving analytics cache:', dbErr);
            }

            worker.terminate();
            workerRef.current = null;
          } else if (type === 'ERROR') {
            setError(err || 'Web Worker operation failed.');
            setIsProcessing(false);
            worker.terminate();
            workerRef.current = null;
          }
        };
      } else {
        // No new games fetched, read all from database
        const allParsed = await db.games
          .where('username')
          .equals(cleanUser)
          .sortBy('endTime');

        if (allParsed.length === 0) {
          setIsProcessing(false);
          setError('No historical game records available.');
          return;
        }

        const gamesList = allParsed.map(cg => cg.gameData);
        setGames(gamesList);

        setProgressMessage('ANALYZING DATABASE CACHE...');
        
        worker.onmessage = async (e: MessageEvent) => {
          const { type, progress: p, error: err, stage, analytics: computedAnalytics } = e.data;
          
          if (type === 'STAGE') {
            setProgressMessage(stage);
            setProgress(p);
            
            if (stage === 'PROCESSING OPENING DNA') {
              setCurrentTier(2);
            } else if (stage === 'COMPUTING TILT METRICS') {
              setCurrentTier(3);
            } else if (stage === 'REPERTOIRE INTELLIGENCE UPDATED') {
              setCurrentTier(4);
            }
          } else if (type === 'ANALYTICS_COMPLETE') {
            setProgress(100);
            setProgressMessage('FULL LONGITUDINAL TELEMETRY PROCESSED');
            setIsProcessing(false);
            setAnalytics(computedAnalytics);
            setCurrentTier(4);
            setHasLoaded(true);
            setGames(allParsed.map(cg => cg.gameData));

            try {
              await db.analytics.put({
                username: cleanUser,
                computedAt: Date.now(),
                data: computedAnalytics
              });
            } catch (dbErr) {
              console.error('Error saving analytics cache:', dbErr);
            }

            worker.terminate();
            workerRef.current = null;
          } else if (type === 'ERROR') {
            setError(err || 'Worker analytics processing failed.');
            setIsProcessing(false);
            worker.terminate();
            workerRef.current = null;
          }
        };

        await runAnalyticsStage(allParsed.map(cg => cg.gameData));
      }
    } catch (err: any) {
      console.error('Telemetry scan error:', err);
      setError(err.message || 'Error occurred while loading game telemetry.');
      setIsLoadingArchives(false);
      setIsProcessing(false);
    }
  }, [username]);

  return {
    games,
    analytics,
    progress,
    progressMessage,
    currentTier,
    isProcessing,
    isLoadingArchives,
    error,
    startTelemetry,
    hasLoaded
  };
}
