'use strict';
'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { usePgnWorker } from '@/hooks/usePgnWorker';
import Navbar from '@/components/layout/Navbar';
import ProfileHeader from '@/features/player/ProfileHeader';
import RatingCards from '@/features/player/RatingCards';
import RatingChart from '@/features/analytics/RatingChart';
import WinRateDonut from '@/features/analytics/WinRateDonut';
import ActivityHeatmap from '@/features/analytics/ActivityHeatmap';
import OpeningIntelligence from '@/features/openings/OpeningIntelligence';
import RecentGamesTable from '@/features/games/RecentGamesTable';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  Play, 
  Activity, 
  Cpu, 
  ShieldAlert 
} from 'lucide-react';

interface PlayerPageProps {
  params: Promise<{ username: string }>;
}

export default function PlayerPage({ params }: PlayerPageProps) {
  const { username } = use(params);
  const cleanUser = decodeURIComponent(username);

  // Core metadata queries
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = usePlayerProfile(cleanUser);

  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats,
  } = usePlayerStats(cleanUser);

  // Background worker telemetry hook
  const {
    games,
    progress,
    isProcessing,
    isLoadingArchives,
    error: telemetryError,
    startTelemetry,
    hasLoaded
  } = usePgnWorker(cleanUser);

  const handleRetry = () => {
    refetchProfile();
    refetchStats();
  };

  const isLoading = isProfileLoading || isStatsLoading;
  const hasError = !!profileError || !!statsError;

  return (
    <div className="flex flex-col min-h-screen bg-[#06080d] text-[#f3f4f6]">
      {/* Background Grid Accent */}
      <div className="fixed inset-0 grid-scanlines opacity-15 pointer-events-none z-0" />

      <Navbar />

      <div className="flex-grow z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Search</span>
          </Link>

          {/* Sparkles Wrapped Trigger */}
          {hasLoaded && (
            <Link
              href={`/player/${cleanUser}/wrapped`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neon-green/10 border border-neon-green/35 px-4 py-1.5 font-mono text-xs font-semibold tracking-wider text-neon-green uppercase hover:bg-neon-green hover:text-black transition-all shadow-[0_0_10px_rgba(57,255,20,0.15)] cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Generate Chess Wrapped</span>
            </Link>
          )}
        </div>

        {isLoading ? (
          /* Skeletons Layout */
          <div className="space-y-8 animate-pulse">
            <div className="h-36 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-56 rounded-xl bg-zinc-900/60 border border-zinc-800" />
              <div className="h-56 rounded-xl bg-zinc-900/60 border border-zinc-800" />
              <div className="h-56 rounded-xl bg-zinc-900/60 border border-zinc-800" />
            </div>
          </div>
        ) : hasError ? (
          /* Profile Fetch Errors */
          <div className="flex flex-col items-center justify-center text-center p-12 border border-zinc-900 rounded-2xl bg-[#0f121d] max-w-xl mx-auto mt-12 gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neon-red/10 border border-neon-red/35">
              <AlertTriangle className="h-7 w-7 text-neon-red" />
            </div>
            <div>
              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">Analysis Operations Interrupted</h3>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed mt-2 max-w-sm">
                Failed to gather public Chess.com data for player &quot;{cleanUser}&quot;. Please verify the username capitalization or check Chess.com API status.
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-5 py-2.5 font-mono text-xs font-semibold text-white hover:border-zinc-500 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>RETRY ANALYSIS</span>
            </button>
          </div>
        ) : (
          /* Main Consolidated Dashboard Layout */
          <div className="space-y-8 animate-fade-in">
            {/* Headers & Basic stats */}
            {profile && <ProfileHeader profile={profile} />}
            {stats && <RatingCards stats={stats} />}

            {/* Telemeter Scanning & Loading Overlay box */}
            {!hasLoaded && (
              <div className="rounded-xl border border-zinc-900 bg-[#0a0d14]/75 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-1.5">
                  <h5 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-neon-green" />
                    RAW ARCHIVE PGN TELEMETRY ENGINE
                  </h5>
                  <p className="text-[11px] text-zinc-500 font-sans max-w-xl leading-relaxed">
                    Deploy background Web Workers to scan the last 3 months of chess records, calculate openings efficiency, streak volatility, and upset patterns.
                  </p>
                  
                  {/* Status loaders */}
                  {(isLoadingArchives || isProcessing) && (
                    <div className="mt-4 flex flex-col gap-2 w-full max-w-md">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-neon-green">
                        {isLoadingArchives ? 'Gathering archives...' : `Parsing games chunk... ${progress}%`}
                      </span>
                      <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900">
                        <div className="bg-neon-green h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {telemetryError && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-neon-red font-mono">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{telemetryError}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={startTelemetry}
                  disabled={isLoadingArchives || isProcessing}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-neon-green px-6 py-3 font-mono text-xs font-bold text-black hover:bg-white transition-all active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:pointer-events-none cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-black" />
                  <span>START TELEMETRY SCAN</span>
                </button>
              </div>
            )}

            {/* Loaded Telemetry Features Grid */}
            {hasLoaded && games.length > 0 && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Section 1: Rating trends and general combat ratios */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Rating timeline (spans 2 columns) */}
                  <div className="lg:col-span-2">
                    <RatingChart games={games} />
                  </div>
                  {/* Combat breakdown donut (spans 1 column) */}
                  <div className="lg:col-span-1">
                    <WinRateDonut games={games} />
                  </div>
                </div>

                {/* Section 2: Combat heat map */}
                <ActivityHeatmap games={games} />
                {/* Section 3: Cinematic Opening Strategy Grid */}
                <OpeningIntelligence games={games} />

                {/* Section 4: Game logs table */}
                <RecentGamesTable games={games} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
