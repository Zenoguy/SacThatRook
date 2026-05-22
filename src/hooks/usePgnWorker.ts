'use strict';
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { ParsedGame, ChessComGame } from '@/types/chess';
import { fetchPlayerArchives, fetchMonthlyGames } from '@/services/chesscom';

interface UsePgnWorkerReturn {
  games: ParsedGame[];
  progress: number;
  isProcessing: boolean;
  isLoadingArchives: boolean;
  error: string | null;
  startTelemetry: () => Promise<void>;
  hasLoaded: boolean;
}

export function usePgnWorker(username: string): UsePgnWorkerReturn {
  const [games, setGames] = useState<ParsedGame[]>([]);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const workerRef = useRef<Worker | null>(null);

  // Clean up worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const startTelemetry = useCallback(async () => {
    if (!username) return;
    
    setIsLoadingArchives(true);
    setProgress(0);
    setError(null);
    setHasLoaded(false);

    try {
      const cleanUser = username.trim().toLowerCase();

      // Step 1: Check IndexedDB Cache first
      const cachedGames = await db.games
        .where('username')
        .equals(cleanUser)
        .sortBy('endTime');

      if (cachedGames.length > 0) {
        // We have cached parsed games! Load them immediately
        setGames(cachedGames.map(cg => cg.gameData));
        setIsLoadingArchives(false);
        setHasLoaded(true);
        setProgress(100);
        return;
      }

      // Step 2: Fetch Monthly Archives list from Chess.com
      const archives = await fetchPlayerArchives(cleanUser);
      if (archives.length === 0) {
        setIsLoadingArchives(false);
        setError('No historical games found for this player.');
        return;
      }

      // Slice the last 3 active months of play
      const targetArchives = archives.slice(-3);
      setIsLoadingArchives(false);
      setIsProcessing(true);

      // Fetch all ChessComGame items for these archives
      const allMonthlyGames = await Promise.all(
        targetArchives.map(archiveUrl => fetchMonthlyGames(archiveUrl))
      );

      // Merge into a single flat array
      const rawGamesList: ChessComGame[] = allMonthlyGames.flat();

      if (rawGamesList.length === 0) {
        setIsProcessing(false);
        setError('No games played in the last 3 months.');
        return;
      }

      // Step 3: Spawn Web Worker for Parsing
      const worker = new Worker(
        new URL('../workers/pgnWorker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      worker.postMessage({
        type: 'PARSE_CHUNKS',
        games: rawGamesList,
        username: cleanUser
      });

      worker.onmessage = async (e: MessageEvent) => {
        const { type, progress: p, error: err, parsedGames } = e.data;

        if (type === 'PROGRESS') {
          setProgress(p);
        } else if (type === 'COMPLETE') {
          setProgress(100);
          setIsProcessing(false);
          setGames(parsedGames);
          setHasLoaded(true);

          // Save parsed games to IndexedDB cache in background
          try {
            const dbRecords = parsedGames.map((g: ParsedGame) => ({
              uuid: g.uuid,
              username: cleanUser,
              gameData: g,
              endTime: g.endTime
            }));
            
            // Bulk add to Dexie (ignores/overwrites duplicates)
            await db.games.bulkPut(dbRecords);
          } catch (dbErr) {
            console.error('Error saving games to IndexedDB cache:', dbErr);
          }

          // Terminate worker
          worker.terminate();
          workerRef.current = null;
        } else if (type === 'ERROR') {
          setError(err || 'Web Worker parsing failed.');
          setIsProcessing(false);
          worker.terminate();
          workerRef.current = null;
        }
      };

    } catch (err: any) {
      console.error('Telemetry scan error:', err);
      setError(err.message || 'Error occurred while loading game telemetry.');
      setIsLoadingArchives(false);
      setIsProcessing(false);
    }
  }, [username]);

  return {
    games,
    progress,
    isProcessing,
    isLoadingArchives,
    error,
    startTelemetry,
    hasLoaded
  };
}
