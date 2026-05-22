'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import { ParsedGame } from '@/types/chess';
import { computeOpeningStats } from '@/utils/analytics';
import { BookOpen, User, HelpCircle, Layers } from 'lucide-react';

interface OpeningsTableProps {
  games: ParsedGame[];
}

export default function OpeningsTable({ games }: OpeningsTableProps) {
  const [selectedColor, setSelectedColor] = useState<'ALL' | 'white' | 'black'>('ALL');

  const openingsStats = useMemo(() => {
    let stats = computeOpeningStats(games);
    if (selectedColor !== 'ALL') {
      stats = stats.filter(s => s.color === selectedColor);
    }
    return stats;
  }, [games, selectedColor]);

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-neon-blue" />
            Opening Blueprints
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Win rates and patterns grouped by ECO structures</p>
        </div>

        {/* Tab filters */}
        <div className="flex rounded-lg bg-zinc-950 border border-zinc-900 p-1 font-mono text-[9px]">
          <button
            onClick={() => setSelectedColor('ALL')}
            className={`rounded px-3 py-1 font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedColor === 'ALL'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            All Perspectives
          </button>
          <button
            onClick={() => setSelectedColor('white')}
            className={`rounded px-3 py-1 font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedColor === 'white'
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            White Only
          </button>
          <button
            onClick={() => setSelectedColor('black')}
            className={`rounded px-3 py-1 font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedColor === 'black'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            Black Only
          </button>
        </div>
      </div>

      {/* Main Openings Table */}
      <div className="w-full overflow-x-auto select-none rounded-xl border border-zinc-900 bg-zinc-950/20">
        <table className="w-full min-w-[650px] text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-zinc-900 bg-zinc-950/40 text-zinc-500 uppercase tracking-widest font-mono text-[9px]">
              <th className="py-4 px-4 font-bold">Opening structure</th>
              <th className="py-4 px-4 font-bold text-center">Perspective</th>
              <th className="py-4 px-4 font-bold text-center">Fights</th>
              <th className="py-4 px-4 font-bold">Win Rate efficiency</th>
              <th className="py-4 px-4 font-bold text-right">Avg Opponent Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60 font-mono text-[10px]">
            {openingsStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-zinc-650 uppercase tracking-wider text-[10px]">
                  No opening telemetry compiled for this perspective
                </td>
              </tr>
            ) : (
              openingsStats.slice(0, 10).map((stat) => {
                const total = stat.wins + stat.losses + stat.draws;
                
                // Pct calculations
                const winPct = total > 0 ? (stat.wins / total) * 100 : 0;
                const drawPct = total > 0 ? (stat.draws / total) * 100 : 0;
                const lossPct = total > 0 ? (stat.losses / total) * 100 : 0;

                const colorClass = stat.color === 'white' 
                  ? 'bg-white text-black border border-zinc-300 shadow-sm' 
                  : 'bg-zinc-900 text-zinc-300 border border-zinc-800';

                return (
                  <tr key={`${stat.eco}-${stat.color}`} className="hover:bg-zinc-900/15 transition-all">
                    {/* Opening Name & ECO */}
                    <td className="py-3.5 px-4 font-sans text-xs">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-900 border border-zinc-850 px-2 py-0.5 font-mono text-[9px] font-extrabold text-neon-blue">
                          {stat.eco}
                        </span>
                        <span className="font-semibold text-white tracking-wide truncate max-w-[220px]" title={stat.name}>
                          {stat.name}
                        </span>
                      </div>
                    </td>

                    {/* Color perspective */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[8px] font-black uppercase ${colorClass}`}>
                        {stat.color}
                      </span>
                    </td>

                    {/* Fights (Played Count) */}
                    <td className="py-3.5 px-4 text-center font-bold text-white text-xs">
                      {stat.gamesCount}
                    </td>

                    {/* Win rate progress bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3 max-w-[200px]">
                        <span className="w-10 font-bold text-neon-green text-left text-xs">{stat.winRate.toFixed(1)}%</span>
                        
                        {/* Micro visual progress bar */}
                        <div className="relative h-1.5 flex-grow overflow-hidden rounded-full bg-zinc-900 flex">
                          <div className="h-full bg-neon-green" style={{ width: `${winPct}%` }} title={`Wins: ${stat.wins}`} />
                          <div className="h-full bg-slate-500" style={{ width: `${drawPct}%` }} title={`Draws: ${stat.draws}`} />
                          <div className="h-full bg-neon-red" style={{ width: `${lossPct}%` }} title={`Losses: ${stat.losses}`} />
                        </div>
                      </div>
                    </td>

                    {/* Avg Opp Rating */}
                    <td className="py-3.5 px-4 text-right font-bold text-zinc-350 text-xs">
                      {stat.avgOpponentRating}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tiny descriptive note */}
      <div className="border-t border-zinc-900 pt-4 flex gap-1.5 items-center font-mono text-[9px] text-zinc-550">
        <Layers className="h-3.5 w-3.5" />
        <span>Categorized based on parsed ECO Chess.com game history records</span>
      </div>
    </div>
  );
}
