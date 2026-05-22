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
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#040609] py-8 z-10 font-mono text-[10px] text-zinc-500 text-center">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} SacThatRook. All Rights Reserved. Created by chess aficionados.</p>
          <p className="mt-2 text-zinc-655">This application is powered by the public Chess.com API but is not affiliated with Chess.com.</p>
        </div>
      </footer>
    </div>
  );
}
