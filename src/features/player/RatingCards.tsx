'use strict';
'use client';

import React from 'react';
import { ChessComStats, RatingStats } from '@/types/chess';
import { Zap, Timer, Rocket, Target, Trophy, Info } from 'lucide-react';

interface RatingCardsProps {
  stats: ChessComStats;
}

export default function RatingCards({ stats }: RatingCardsProps) {
  const timeControls = [
    {
      key: 'chess_blitz',
      title: 'Blitz',
      icon: Zap,
      accentClass: 'text-neon-green',
      accentGlow: 'glow-card',
      data: stats.chess_blitz,
    },
    {
      key: 'chess_rapid',
      title: 'Rapid',
      icon: Timer,
      accentClass: 'text-neon-blue',
      accentGlow: 'glow-card glow-card-blue',
      data: stats.chess_rapid,
    },
    {
      key: 'chess_bullet',
      title: 'Bullet',
      icon: Rocket,
      accentClass: 'text-neon-red',
      accentGlow: 'glow-card glow-card-red',
      data: stats.chess_bullet,
    },
  ];

  const puzzleRating = stats.tactics?.highest?.rating || null;
  const puzzleRushScore = stats.puzzle_rush?.best?.score || null;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 3 Main Time Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {timeControls.map(({ title, icon: Icon, accentClass, accentGlow, data }) => {
          if (!data) {
            return (
              <div 
                key={title} 
                className="glow-card rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] border border-zinc-900 bg-[#0f121d] text-center"
              >
                <Icon className="h-8 w-8 text-zinc-650 mb-3 opacity-40" />
                <h3 className="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest">{title}</h3>
                <p className="text-xs text-zinc-650 font-mono mt-1">No rated history available</p>
              </div>
            );
          }

          const { last, best, record } = data;
          const total = record.win + record.loss + record.draw;
          const winRate = total > 0 ? ((record.win / total) * 100).toFixed(1) : '0';
          
          // Ratios for visual bar
          const winPct = total > 0 ? (record.win / total) * 100 : 0;
          const drawPct = total > 0 ? (record.draw / total) * 100 : 0;
          const lossPct = total > 0 ? (record.loss / total) * 100 : 0;

          return (
            <div key={title} className={`${accentGlow} rounded-xl p-6 flex flex-col justify-between h-full`}>
              <div>
                {/* Heading */}
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <Icon className={`h-4 w-4 ${accentClass}`} />
                    {title}
                  </span>
                  {best && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 uppercase">
                      <Trophy className="h-3 w-3 text-yellow-500" />
                      Peak: <strong className="text-zinc-300 font-bold">{best.rating}</strong>
                    </span>
                  )}
                </div>

                {/* Rating Display */}
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-sans text-4xl md:text-5xl font-black text-white tracking-tight">
                    {last.rating}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                    Rating
                  </span>
                </div>
              </div>

              {/* Records & Win Rates */}
              <div className="mt-4 border-t border-zinc-900 pt-4 space-y-3.5">
                <div className="flex justify-between items-center font-mono text-[10px]">
                  <span className="text-zinc-500 uppercase tracking-wider">Win Rate</span>
                  <span className={`font-bold ${accentClass}`}>{winRate}%</span>
                </div>

                {/* Styled Ratio Bar */}
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-900 flex">
                  <div className="h-full bg-neon-green" style={{ width: `${winPct}%` }} title={`Wins: ${record.win}`} />
                  <div className="h-full bg-slate-500" style={{ width: `${drawPct}%` }} title={`Draws: ${record.draw}`} />
                  <div className="h-full bg-neon-red" style={{ width: `${lossPct}%` }} title={`Losses: ${record.loss}`} />
                </div>

                {/* Win / Draw / Loss Numbers */}
                <div className="flex justify-between font-mono text-[9px] text-zinc-500 tracking-wider">
                  <span>W: <strong className="text-neon-green">{record.win}</strong></span>
                  <span>D: <strong className="text-zinc-400">{record.draw}</strong></span>
                  <span>L: <strong className="text-neon-red">{record.loss}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Puzzles & Tactics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Puzzle Card */}
        <div className="glow-card rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0c0e16]">
              <Target className="h-6 w-6 text-neon-blue" />
            </div>
            <div>
              <h4 className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest">Tactics puzzles</h4>
              <p className="font-sans text-lg font-black text-white mt-0.5">
                {puzzleRating ? `${puzzleRating} Peak` : 'No tactics record'}
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1">
            Solo puzzles
          </span>
        </div>

        {/* Puzzle Rush Card */}
        <div className="glow-card rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0c0e16]">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h4 className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest">Puzzle Rush</h4>
              <p className="font-sans text-lg font-black text-white mt-0.5">
                {puzzleRushScore ? `${puzzleRushScore} Best Score` : 'No Puzzle Rush record'}
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] text-zinc-500 uppercase bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1">
            Speed rush
          </span>
        </div>
      </div>
    </div>
  );
}
