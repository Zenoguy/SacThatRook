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
import CircadianTelemetry from '@/features/analytics/CircadianTelemetry';
import OpeningIntelligence from '@/features/openings/OpeningIntelligence';
import RecentGamesTable from '@/features/games/RecentGamesTable';
import PlayerIdentityDossier from '@/features/player/PlayerIdentityDossier';
import CareerNarrative from '@/features/analytics/CareerNarrative';
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertTriangle, 
  Sparkles, 
  Play, 
  Activity, 
  Cpu, 
  ShieldAlert,
  Lock
} from 'lucide-react';

interface PlayerPageProps {
  params: Promise<{ username: string }>;
}

export default function PlayerPage({ params }: PlayerPageProps) {
  const { username } = use(params);
  const cleanUser = decodeURIComponent(username);

  const [cacheBust, setCacheBust] = React.useState(0);
  const [isSyncing, setIsSyncing] = React.useState(false);

  // Core metadata queries
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = usePlayerProfile(cleanUser, cacheBust);

  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = usePlayerStats(cleanUser, cacheBust);

  // Background worker telemetry hook
  const {
    games,
    analytics,
    progress,
    progressMessage,
    currentTier,
    isProcessing,
    isLoadingArchives,
    error: telemetryError,
    startTelemetry,
    hasLoaded
  } = usePgnWorker(cleanUser);

  const renderLockPlaceholder = (tierNum: number, label: string, status: string) => {
    return (
      <div className="glow-card rounded-2xl p-8 flex flex-col justify-center items-center min-h-[220px] relative overflow-hidden bg-[#0a0d14]/40 border border-zinc-900/50 select-none">
        {/* Animated scanning line */}
        <div className="absolute inset-x-0 h-[1px] bg-neon-green/20 top-0 animate-scanline" />
        <Lock className="h-8 w-8 text-zinc-700 animate-pulse mb-3" />
        <h5 className="font-mono text-xs font-bold text-zinc-500 uppercase tracking-widest">
          [LOCKED] TIER {tierNum} ANALYSIS
        </h5>
        <span className="font-mono text-[9px] text-zinc-650 uppercase tracking-widest mt-1">
          {label}
        </span>
        <span className="mt-4 font-mono text-[9px] text-neon-green/60 uppercase tracking-wider px-2 py-0.5 border border-neon-green/20 rounded bg-neon-green/5 animate-pulse">
          {status}
        </span>
      </div>
    );
  };

  const handleRetry = () => {
    setCacheBust(Date.now());
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    const newBust = Date.now();
    setCacheBust(newBust);
    
    if (hasLoaded) {
      try {
        await startTelemetry(true);
      } catch (err) {
        console.error('Failed to sync telemetry:', err);
      }
    }
    setIsSyncing(false);
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
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Search</span>
            </Link>
            <div className="text-zinc-800">|</div>
            <button
              onClick={handleRefresh}
              disabled={isSyncing || isLoading}
              className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-neon-green transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              title="Clear cache and fetch live stats from Chess.com"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-neon-green' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live Data'}</span>
            </button>
          </div>

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
            {(!hasLoaded || isProcessing || isLoadingArchives) && (
              <div className="rounded-xl border border-zinc-900 bg-[#0a0d14]/75 p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute inset-0 grid-scanlines opacity-5 pointer-events-none" />
                <div className="space-y-1.5 w-full md:w-auto z-10">
                  <h5 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-2">
                    <Cpu className={`h-4 w-4 text-neon-green ${(isProcessing || isLoadingArchives) ? 'animate-spin' : ''}`} />
                    RAW ARCHIVE PGN TELEMETRY ENGINE
                  </h5>
                  <p className="text-[11px] text-zinc-500 font-sans max-w-xl leading-relaxed">
                    Deploy background Web Workers to scan the player's entire career archives, calculate openings efficiency, streak volatility, and upset patterns.
                  </p>
                  
                  {/* Status loaders */}
                  {(isLoadingArchives || isProcessing) && (
                    <div className="mt-4 flex flex-col gap-2 w-full max-w-md">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-neon-green animate-pulse">
                        {progressMessage || 'Ingesting archives...'}
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

                {!isProcessing && !isLoadingArchives && (
                  <button
                    onClick={() => startTelemetry()}
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-neon-green px-6 py-3 font-mono text-xs font-bold text-black hover:bg-white transition-all active:scale-95 z-10 cursor-pointer animate-pulse"
                  >
                    <Play className="h-3.5 w-3.5 fill-black" />
                    <span>START TELEMETRY SCAN</span>
                  </button>
                )}
              </div>
            )}

            {/* Loaded Telemetry Features Grid */}
            {(hasLoaded || games.length > 0 || isProcessing || isLoadingArchives) && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Section 1: Rating trends and general combat ratios */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Rating timeline (spans 2 columns) - Tier 3 */}
                  <div className="lg:col-span-2">
                    {currentTier >= 3 ? (
                      <RatingChart games={games} confidence={analytics?.confidence} />
                    ) : (
                      renderLockPlaceholder(3, 'Rating Trajectory & historical trends', 'Awaiting rating trajectory compilation')
                    )}
                  </div>
                  {/* Combat breakdown donut (spans 1 column) - Tier 2 */}
                  <div className="lg:col-span-1">
                    {currentTier >= 2 ? (
                      <WinRateDonut games={games} confidence={analytics?.confidence} />
                    ) : (
                      renderLockPlaceholder(2, 'Combat ratios & win efficiency', 'Awaiting win/draw/loss calculation')
                    )}
                  </div>
                </div>

                {/* Section 2: Combat heat map - Tier 3 */}
                <div>
                  {currentTier >= 3 ? (
                    <ActivityHeatmap games={games} confidence={analytics?.confidence} />
                  ) : (
                    renderLockPlaceholder(3, 'Chronological activity & game density heatmap', 'Awaiting activity map compilation')
                  )}
                </div>

                {/* Section 2.5: Circadian Telemetry & Performance Matrix - Tier 3 */}
                <div>
                  {currentTier >= 3 ? (
                    <CircadianTelemetry games={games} />
                  ) : (
                    renderLockPlaceholder(3, 'Circadian performance & combat timing matrix', 'Awaiting circadian intelligence scan')
                  )}
                </div>

                {/* Section 3: Cinematic Opening Strategy Grid - Tier 2 */}
                <div>
                  {currentTier >= 2 ? (
                    <OpeningIntelligence games={games} confidence={analytics?.confidence} />
                  ) : (
                    renderLockPlaceholder(2, 'Opening DNA, Repertoire & tactical profiles', 'Awaiting repertoire analysis')
                  )}
                </div>

                {/* Section 4: Dossier & Narratives Grid - Tier 4 */}
                {(currentTier >= 4 && analytics) ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PlayerIdentityDossier 
                      identity={analytics.playerIdentity}
                      tacticalProfile={analytics.tacticalProfile}
                      confidence={analytics.confidence}
                    />
                    <CareerNarrative insights={analytics.longitudinal.insights} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {renderLockPlaceholder(4, 'Quantum subject identity dossier', currentTier >= 4 ? 'Compiling dossier...' : 'Awaiting stage 4 intelligence trigger')}
                    {renderLockPlaceholder(4, 'Longitudinal career evolution timeline', currentTier >= 4 ? 'Compiling timeline...' : 'Awaiting stage 4 timeline generation')}
                  </div>
                )}

                {/* Section 5: Game logs table - Tier 4 */}
                {currentTier >= 4 ? (
                  <RecentGamesTable games={games} />
                ) : (
                  renderLockPlaceholder(4, 'Recent historical game archives', 'Awaiting game registry load')
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
