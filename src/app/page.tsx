'use strict';
'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import SearchBar from '@/components/ui/SearchBar';
import {
  TrendingUp,
  BookOpen,
  Sparkles,
  Cpu,
  Award
} from 'lucide-react';
import TopPlayers from '@/features/player/TopPlayers';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#06080d] text-[#f3f4f6]">
      {/* Background Matrix Grid */}
      <div className="fixed inset-0 grid-scanlines opacity-40 pointer-events-none z-0" />
      <div className="fixed inset-0 bg-radial-gradient from-transparent via-[#06080d]/80 to-[#06080d] pointer-events-none z-0" />

      {/* Main Header */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center z-10 pt-20 pb-16">
        <div className="w-full flex flex-col items-center text-center px-4 max-w-5xl mb-16">
          {/* Glowing Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 px-4 py-1.5 font-mono text-xs font-semibold tracking-wider text-neon-green uppercase mb-6 animate-pulse-glow">
            <Sparkles className="h-3.5 w-3.5" />
            Every blunder tells a story.
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight font-sans text-white mb-6">
            SAC YOUR ROOK.<br />
            <span className="text-neon-green text-glow-green">CRUSH THE ANALYTICS.</span>
          </h1>

          <p className="max-w-2xl text-sm md:text-lg text-zinc-400 font-mono tracking-wide leading-relaxed mb-10">
            Analyze openings, rating swings, streaks, and tactical patterns from any Chess.com profile — instantly, entirely client-side.
          </p>

          <SearchBar />
        </div>
        {/* Feature Cards Grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full mt-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Card 1 */}
            <div className="glow-card rounded-xl p-6 flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0c0e16]">
                <TrendingUp className="h-6 w-6 text-neon-green" />
              </div>

              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">
                Tilt Monitor
              </h3>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Track streaks, collapses, peak elo, and the exact moment your tilt spiral began.
              </p>
            </div>

            {/* Card 2 */}
            <div className="glow-card glow-card-blue rounded-xl p-6 flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0c0e16]">
                <BookOpen className="h-6 w-6 text-neon-blue" />
              </div>

              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">
                Opening DNA
              </h3>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Discover which openings make you look brilliant and which ones quietly sabotage your rating.
              </p>
            </div>

            {/* Card 3 */}
            <div className="glow-card rounded-xl p-6 flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0c0e16]">
                <Cpu className="h-6 w-6 text-neon-green" />
              </div>

              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">
                Deep Scan
              </h3>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Massive PGN archives parsed locally at alarming speed without melting your browser.
              </p>
            </div>

            {/* Card 4 */}
            <div className="glow-card glow-card-red rounded-xl p-6 flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0c0e16]">
                <Award className="h-6 w-6 text-neon-red" />
              </div>

              <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">
                Annual Damage Report
              </h3>

              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Your entire chess year summarized into one beautifully incriminating report.
              </p>
            </div>

          </div>
        </div>

        {/* Top Players Telemetry Grid */}
        <TopPlayers />

        {/* About the System */}
        <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-24 mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left panel: Big atmospheric explanation */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-black uppercase tracking-widest text-neon-green">
                  SYSTEM DOSSIER // CLASSIFIED INFO
                </span>
                <h2 className="text-3xl font-extrabold text-white tracking-wider font-mono uppercase">
                  ABOUT THE SYSTEM
                </h2>
              </div>
              
              <p className="font-sans text-sm text-zinc-450 leading-relaxed max-w-md">
                SacThatRook analyzes public chess games to uncover opening habits, tactical tendencies, streak behavior, tilt patterns, and repertoire identity.
              </p>

              <div className="space-y-2 border-l border-neon-green/30 pl-4 py-1 font-mono text-xs text-zinc-500 uppercase tracking-wider">
                <p>No accounts.</p>
                <p>No cloud profiling.</p>
                <p>No engine spam.</p>
              </div>

              <p className="font-mono text-xs text-neon-green/80 font-bold uppercase tracking-widest">
                // Just raw chess telemetry.
              </p>
            </div>

            {/* Right panel: 3-4 intelligence cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              
              {/* Card 1 */}
              <div className="glow-card rounded-xl p-6 bg-zinc-950/20 border border-zinc-900/60 flex flex-col gap-3">
                <span className="font-mono text-[9px] font-extrabold text-neon-green uppercase tracking-widest">// SEC_01</span>
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  NO ENGINE REQUIRED
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Most insights are derived directly from PGNs, structures, openings, and statistical patterns.
                </p>
              </div>

              {/* Card 2 */}
              <div className="glow-card glow-card-blue rounded-xl p-6 bg-zinc-950/20 border border-zinc-900/60 flex flex-col gap-3">
                <span className="font-mono text-[9px] font-extrabold text-neon-blue uppercase tracking-widest">// SEC_02</span>
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  CLIENT-SIDE PROCESSING
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Analysis runs locally in your browser using incremental PGN parsing and worker threads.
                </p>
              </div>

              {/* Card 3 */}
              <div className="glow-card glow-card-purple rounded-xl p-6 bg-zinc-950/20 border border-zinc-900/60 flex flex-col gap-3">
                <span className="font-mono text-[9px] font-extrabold text-purple-400 uppercase tracking-widest">// SEC_03</span>
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  TACTICAL DOSSIERS
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Every profile becomes a playable identity: openings, collapses, chaos index, and comfort zones.
                </p>
              </div>

              {/* Card 4 */}
              <div className="glow-card glow-card-red rounded-xl p-6 bg-zinc-950/20 border border-zinc-900/60 flex flex-col gap-3">
                <span className="font-mono text-[9px] font-extrabold text-neon-red uppercase tracking-widest">// SEC_04</span>
                <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  NO SIGNUPS
                </h4>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  Enter a username. Run the scan. Disappear into the blitz queue again.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#040609] py-8 z-10 font-mono text-[10px] text-zinc-500 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} SacThatRook. All Rights Reserved. Created by Zeno_guy.</p>
          <p className="mt-2 text-zinc-655">This application is powered by the public Chess.com API but is not affiliated with Chess.com.</p>
        </div>
      </footer>
    </div>
  );
}
