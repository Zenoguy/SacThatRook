'use strict';
'use client';

import React, { useMemo } from 'react';
import { ParsedGame } from '@/types/chess';
import { computeOpeningStats } from '@/utils/analytics';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { BarChart3, HelpCircle } from 'lucide-react';

interface OpeningWinRateChartProps {
  games: ParsedGame[];
}

export default function OpeningWinRateChart({ games }: OpeningWinRateChartProps) {
  const chartData = useMemo(() => {
    const stats = computeOpeningStats(games);
    // Take the top 5 most played openings
    return stats.slice(0, 5).map(s => ({
      name: `${s.eco} - ${s.name.split(':')[0]}`, // Clean opening name prefix
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      total: s.gamesCount,
    }));
  }, [games]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col justify-between h-full w-full">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-5 mb-6">
        <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-neon-green" />
          Top Opening Breakdown
        </h4>
        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Stacked win/draw/loss counts for top 5 structures</p>
      </div>

      {/* Chart Canvas */}
      <div className="h-[250px] w-full font-mono text-[9px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#10141d" horizontal={false} />
            <XAxis type="number" stroke="#475569" tickLine={false} axisLine={false} />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="#475569" 
              tickLine={false} 
              axisLine={false}
              width={80}
              tickFormatter={(val) => {
                // Shorten labels to avoid overlapping
                return val.length > 10 ? `${val.substring(0, 10)}...` : val;
              }}
            />
            
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-zinc-800 bg-[#0f121d]/95 p-3 shadow-xl backdrop-blur-md font-sans text-xs">
                      <div className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-1.5 truncate max-w-[200px]">
                        {data.name}
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-6">
                          <span className="text-zinc-400">Wins:</span>
                          <strong className="text-neon-green font-bold">{data.wins}</strong>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-zinc-400">Draws:</span>
                          <span className="text-slate-400">{data.draws}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-zinc-400">Losses:</span>
                          <strong className="text-neon-red font-bold">{data.losses}</strong>
                        </div>
                        <div className="flex justify-between gap-6 border-t border-zinc-850 pt-1 mt-1 font-mono text-[10px]">
                          <span className="text-zinc-500">Total Fights:</span>
                          <strong className="text-white font-extrabold">{data.total}</strong>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend 
              iconSize={8}
              iconType="rect"
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 9, paddingTop: 15 }}
            />

            <Bar dataKey="wins" name="Wins" stackId="a" fill="#39ff14" radius={[0, 0, 0, 0]} />
            <Bar dataKey="draws" name="Draws" stackId="a" fill="#64748b" radius={[0, 0, 0, 0]} />
            <Bar dataKey="losses" name="Losses" stackId="a" fill="#ff3b30" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
