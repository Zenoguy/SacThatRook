'use strict';
'use client';

import React, { useMemo } from 'react';
import { ParsedGame } from '@/types/chess';
import { PieChart, Pie, Cell } from 'recharts';
import { Target, HelpCircle } from 'lucide-react';

interface WinRateDonutProps {
  games: ParsedGame[];
}

export default function WinRateDonut({ games }: WinRateDonutProps) {
  const data = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    for (const game of games) {
      if (game.result === 'W') wins++;
      else if (game.result === 'L') losses++;
      else draws++;
    }

    const total = wins + losses + draws;

    return {
      total,
      wins,
      losses,
      draws,
      winRate: total > 0 ? ((wins / total) * 100).toFixed(1) : '0',
      lossRate: total > 0 ? ((losses / total) * 100).toFixed(1) : '0',
      drawRate: total > 0 ? ((draws / total) * 100).toFixed(1) : '0',
      chartArray: [
        { name: 'Wins', value: wins, color: '#39ff14' },
        { name: 'Draws', value: draws, color: '#64748b' },
        { name: 'Losses', value: losses, color: '#ff3b30' },
      ],
    };
  }, [games]);

  if (data.total === 0) {
    return null;
  }

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full w-full">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-5 mb-5">
        <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Target className="h-4 w-4 text-neon-green" />
          Combat Breakdown
        </h4>
        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Win, draw, loss efficiency ratio</p>
      </div>

      {/* Chart and Stats Container */}
      <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
        {/* Donut Pie Chart */}
        <div className="relative h-44 w-44 flex items-center justify-center">
          <PieChart width={176} height={176}>
            <Pie
              data={data.chartArray}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.chartArray.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#06080d" strokeWidth={3} />
              ))}
            </Pie>
          </PieChart>

          {/* Central Win Rate Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-sans text-2xl font-black text-white leading-none">
              {data.winRate}%
            </span>
            <span className="font-mono text-[9px] uppercase tracking-wider text-neon-green mt-1">
              Win Rate
            </span>
          </div>
        </div>

        {/* Legend stats details */}
        <div className="flex flex-col gap-3 font-mono text-xs w-full md:w-auto">
          {data.chartArray.map((item) => {
            const count = item.name === 'Wins' ? data.wins : item.name === 'Losses' ? data.losses : data.draws;
            const rate = item.name === 'Wins' ? data.winRate : item.name === 'Losses' ? data.lossRate : data.drawRate;
            return (
              <div key={item.name} className="flex items-center justify-between md:justify-start gap-8 border-b border-zinc-950 pb-2 md:border-0 md:pb-0">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px] w-14">
                    {item.name}
                  </span>
                </div>
                <div className="text-right font-sans text-xs">
                  <strong className="text-white font-bold">{count}</strong>
                  <span className="text-[10px] text-zinc-500 ml-1.5">({rate}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tiny descriptive info */}
      <div className="mt-5 border-t border-zinc-900 pt-4 flex gap-1.5 items-center font-mono text-[9px] text-zinc-550">
        <HelpCircle className="h-3.5 w-3.5" />
        <span>Overall results computed across {data.total} games</span>
      </div>
    </div>
  );
}
