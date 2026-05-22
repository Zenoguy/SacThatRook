'use strict';
'use client';

import React, { use, useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePgnWorker } from '@/hooks/usePgnWorker';
import { computeWrappedData } from '@/utils/analytics';
import Navbar from '@/components/layout/Navbar';
import { 
  ArrowLeft, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  RefreshCw, 
  Share2, 
  Download, 
  Check, 
  Trophy, 
  Flame, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import { toPng } from 'html-to-image';

interface WrappedPageProps {
  params: Promise<{ username: string }>;
}

export default function WrappedPage({ params }: WrappedPageProps) {
  const { username } = use(params);
  const cleanUser = decodeURIComponent(username);

  const {
    games,
    progress,
    isProcessing,
    isLoadingArchives,
    error,
    startTelemetry,
    hasLoaded
  } = usePgnWorker(cleanUser);

  // Trigger telemetry scan on mount if not loaded
  useEffect(() => {
    startTelemetry();
  }, [startTelemetry]);

  // Compute Wrapped details
  const wrappedData = useMemo(() => {
    if (games.length === 0) return null;
    return computeWrappedData(games, cleanUser);
  }, [games, cleanUser]);

  const [activeSlide, setActiveSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleNextSlide = () => {
    if (activeSlide < 6) setActiveSlide(prev => prev + 1);
  };

  const handlePrevSlide = () => {
    if (activeSlide > 0) setActiveSlide(prev => prev - 1);
  };

  // Share link
  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Download slide 7 as image
  const handleDownload = async () => {
    if (!exportRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        backgroundColor: '#07090f',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `${cleanUser}_chess_wrapped.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  const isScanning = isLoadingArchives || isProcessing;

  return (
    <div className="flex flex-col min-h-screen bg-[#04060a] text-[#f3f4f6]">
      {/* Background Matrix Grid */}
      <div className="fixed inset-0 grid-scanlines opacity-25 pointer-events-none z-0" />

      <Navbar />

      <div className="flex-grow z-10 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        
        {/* Loading Progress */}
        {isScanning && (
          <div className="flex flex-col items-center justify-center max-w-md text-center p-8 bg-[#0f121d]/50 border border-zinc-900 rounded-2xl gap-6 animate-pulse-glow">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-neon-green/20 border-t-neon-green animate-spin" />
              <Sparkles className="h-6 w-6 text-neon-green" />
            </div>
            <div className="space-y-2">
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest">Compiling Telemetry...</h3>
              <p className="text-[10px] text-zinc-550 font-mono">
                {isLoadingArchives ? 'Fetching monthly PGN archives...' : `Parsing games... ${progress}%`}
              </p>
            </div>
            {/* Progress numerical status */}
            <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-900">
              <div className="bg-neon-green h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* Error screen */}
        {error && !isScanning && (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-zinc-900 rounded-2xl bg-[#0f121d] max-w-xl mx-auto gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neon-red/10 border border-neon-red/35">
              <AlertTriangle className="h-7 w-7 text-neon-red" />
            </div>
            <div>
              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">Scans Blocked</h3>
              <p className="text-xs text-zinc-400 font-sans mt-2">
                Unable to build Wrapped analytics. Error: {error}
              </p>
            </div>
            <Link
              href={`/player/${cleanUser}`}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-800 border border-zinc-700 px-5 py-2.5 font-mono text-xs font-semibold text-white hover:border-zinc-500 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>RETURN TO DASHBOARD</span>
            </Link>
          </div>
        )}

        {/* Slides Presentation */}
        {hasLoaded && wrappedData && (
          <div className="w-full max-w-2xl flex flex-col gap-6 items-center">
            
            {/* Nav slide index indicator bar */}
            <div className="w-full flex gap-1.5">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 flex-grow rounded-full transition-all duration-300 ${
                    i <= activeSlide ? 'bg-neon-green' : 'bg-zinc-900 border border-zinc-950'
                  }`} 
                />
              ))}
            </div>

            {/* Slide Box Wrapper */}
            <div className="glow-card rounded-2xl w-full min-h-[380px] p-8 md:p-10 flex flex-col justify-between items-center text-center bg-[#07090f] select-none relative overflow-hidden">
              
              {/* Slide 0: Welcome */}
              {activeSlide === 0 && (
                <div className="flex flex-col items-center justify-center gap-6 my-auto animate-fade-in">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neon-green/10 border border-neon-green/35 animate-pulse-glow">
                    <Sparkles className="h-8 w-8 text-neon-green" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-extrabold text-white tracking-tight uppercase">
                      CHESS WRAPPED
                    </h2>
                    <p className="font-mono text-xs text-neon-green tracking-widest uppercase">
                      // Tactical Battle Report
                    </p>
                    <p className="text-sm text-zinc-400 font-sans max-w-sm leading-relaxed mt-4">
                      Let&apos;s scan through your chess combat logs from the last 3 months and analyze your play style, streaks, upsets, and habits.
                    </p>
                  </div>
                </div>
              )}

              {/* Slide 1: Total Battles */}
              {activeSlide === 1 && (
                <div className="flex flex-col items-center justify-center gap-6 my-auto animate-fade-in">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-800 bg-[#0c0e16]">
                    <Activity className="h-7 w-7 text-neon-blue" />
                  </div>
                  <div className="space-y-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-550">BATTLING VOLUME</span>
                    <h3 className="text-5xl font-black text-white tracking-tighter">
                      {wrappedData.totalGames.toLocaleString()}
                    </h3>
                    <p className="font-mono text-xs text-zinc-400 uppercase tracking-wide">
                      Total Fights Fought
                    </p>
                    <p className="text-xs text-zinc-500 font-sans max-w-xs mt-3">
                      Your absolute favorite pace of action was <strong className="text-neon-blue uppercase">{wrappedData.favoriteTimeClass}</strong> chess!
                    </p>
                  </div>
                </div>
              )}

              {/* Slide 2: Efficiency */}
              {activeSlide === 2 && (
                <div className="flex flex-col items-center justify-center gap-6 my-auto animate-fade-in">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-800 bg-[#0c0e16]">
                    <Trophy className="h-7 w-7 text-yellow-500" />
                  </div>
                  <div className="space-y-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-550">COMBAT EFFICIENCY</span>
                    <h3 className="text-6xl font-black text-neon-green text-glow-green tracking-tighter">
                      {wrappedData.winRate}%
                    </h3>
                    <p className="font-mono text-xs text-zinc-400 uppercase tracking-wide">
                      Overall Win Rate Ratio
                    </p>
                    {/* W/D/L Grid detail */}
                    <div className="flex gap-4 justify-center font-mono text-[10px] text-zinc-550 mt-4 border-t border-zinc-900 pt-3">
                      <span>W: <strong className="text-neon-green">{wrappedData.wins}</strong></span>
                      <span>D: <strong className="text-slate-400">{wrappedData.draws}</strong></span>
                      <span>L: <strong className="text-neon-red">{wrappedData.losses}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 3: Trusted Structure (Opening) */}
              {activeSlide === 3 && (
                <div className="flex flex-col items-center justify-center gap-6 my-auto animate-fade-in">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-800 bg-[#0c0e16]">
                    <Sparkles className="h-7 w-7 text-neon-blue" />
                  </div>
                  <div className="space-y-3 max-w-sm">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-550">TRUSTED BLUEPRINT</span>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white uppercase tracking-wide">
                      {wrappedData.mostPlayedOpening ? wrappedData.mostPlayedOpening.name : 'Unknown Opening'}
                    </h3>
                    <p className="font-mono text-xs text-neon-blue uppercase tracking-wider">
                      Most Played Opening ({wrappedData.mostPlayedOpening?.eco})
                    </p>
                    <p className="text-xs text-zinc-500 font-sans mt-3">
                      You deployed this exact structure <strong className="text-white">{wrappedData.mostPlayedOpening?.count}</strong> times, earning a solid <strong className="text-neon-green">{wrappedData.mostPlayedOpening?.winRate}%</strong> win efficiency!
                    </p>
                  </div>
                </div>
              )}

              {/* Slide 4: Greatest Triumph (Upset) */}
              {activeSlide === 4 && (
                <div className="flex flex-col items-center justify-center gap-6 my-auto animate-fade-in">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-800 bg-[#0c0e16]">
                    <Trophy className="h-7 w-7 text-yellow-500 animate-bounce" />
                  </div>
                  <div className="space-y-3 max-w-sm">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-550">GREATEST TRIUMPH</span>
                    {wrappedData.biggestUpset ? (
                      <>
                        <h3 className="text-3xl font-black text-neon-green tracking-tighter">
                          +{wrappedData.biggestUpset.ratingDiff} Rating Upset
                        </h3>
                        <p className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
                          Defeated {wrappedData.biggestUpset.opponent} ({wrappedData.biggestUpset.opponentRating})
                        </p>
                        <p className="text-xs text-zinc-500 font-sans mt-3">
                          You conquered a opponent rated <strong className="text-white">{wrappedData.biggestUpset.opponentRating}</strong> while you were sitting at <strong className="text-white">{wrappedData.biggestUpset.playerRating}</strong>. Absolute brilliant calculation! 👑
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-2xl font-extrabold text-white">No major upsets</h3>
                        <p className="text-xs text-zinc-500 font-sans mt-3">You typically fought opponent profiles within comfortable rating parameters.</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Slide 5: Streaks & Tilts */}
              {activeSlide === 5 && (
                <div className="flex flex-col items-center justify-center gap-6 my-auto animate-fade-in">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-zinc-800 bg-[#0c0e16]">
                    <Flame className="h-7 w-7 text-neon-red" />
                  </div>
                  <div className="space-y-4 max-w-sm">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-550">STREAK VOLATILITY</span>
                    <div className="grid grid-cols-2 gap-8 border-b border-zinc-900 pb-4">
                      <div>
                        <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-500">Longest Streak</span>
                        <p className="text-3xl font-black text-neon-green mt-1">+{wrappedData.winStreak}</p>
                      </div>
                      <div>
                        <span className="font-mono text-[8px] uppercase tracking-wider text-zinc-500">Longest Tilt</span>
                        <p className="text-3xl font-black text-neon-red mt-1">-{wrappedData.tiltStreak}</p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 font-sans leading-relaxed">
                      You had an epic win streak of {wrappedData.winStreak} games! However, everyone experiences tilt cycles — your longest loss stretch was {wrappedData.tiltStreak} games. 😅
                    </p>
                  </div>
                </div>
              )}

              {/* Slide 6: Ultimate Shareable Summary Card */}
              {activeSlide === 6 && (
                <div 
                  ref={exportRef}
                  className="w-full flex flex-col items-center justify-center p-6 bg-[#07090f] border border-zinc-850 rounded-xl gap-4 my-auto select-none"
                >
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neon-green">// SAC THAT ROOK //</span>
                  <h3 className="text-xl font-sans font-black text-white tracking-wide uppercase">{cleanUser}&apos;s Chess telemetry</h3>
                  
                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-4 w-full mt-2 font-mono text-[10px] text-zinc-400 text-left border-y border-zinc-900 py-4 px-1">
                    <div className="space-y-1">
                      <div>FIGHTS: <strong className="text-white">{wrappedData.totalGames}</strong></div>
                      <div>WIN RATE: <strong className="text-neon-green">{wrappedData.winRate}%</strong></div>
                      <div>FAVORITE: <strong className="text-neon-blue uppercase">{wrappedData.favoriteTimeClass}</strong></div>
                    </div>
                    <div className="space-y-1 pl-4 border-l border-zinc-900">
                      <div>WIN STREAK: <strong className="text-neon-green">+{wrappedData.winStreak}</strong></div>
                      <div>MAX TILT: <strong className="text-neon-red">-{wrappedData.tiltStreak}</strong></div>
                      <div>UPSET: <strong className="text-yellow-500">+{wrappedData.biggestUpset?.ratingDiff || 0}</strong></div>
                    </div>
                  </div>

                  <p className="text-[9px] text-zinc-500 font-sans mt-2">
                    Analyze profiles instantly at <span className="text-neon-green font-bold">sacthatrook.app</span>
                  </p>
                </div>
              )}

              {/* Controls inside Slide Box */}
              <div className="w-full flex items-center justify-between mt-8 border-t border-zinc-900/60 pt-4">
                <button
                  onClick={handlePrevSlide}
                  disabled={activeSlide === 0}
                  className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                  <span>PREV</span>
                </button>

                {activeSlide < 6 ? (
                  <button
                    onClick={handleNextSlide}
                    className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-neon-green hover:text-white transition-colors cursor-pointer"
                  >
                    <span>NEXT</span>
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 py-1.5 px-3 font-mono text-[9px] font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-neon-green" /> : <Share2 className="h-3.5 w-3.5" />}
                      <span>{copied ? 'LINK COPIED' : 'SHARE LINK'}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="inline-flex items-center gap-1 rounded bg-neon-green py-1.5 px-3 font-mono text-[9px] font-bold text-black hover:bg-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {downloading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      <span>DOWNLOAD PNG</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Dashboard Back Control */}
            <Link
              href={`/player/${cleanUser}`}
              className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Player Dashboard</span>
            </Link>

          </div>
        )}
      </div>
    </div>
  );
}
