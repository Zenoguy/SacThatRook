'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import { ParsedGame } from '@/types/chess';
import { computeRatingHistory } from '@/utils/analytics';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, Award, Zap, Timer, Rocket, Info } from 'lucide-react';

interface Confidence {
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  gamesAnalyzed: number;
  yearsCount: number;
  coverageStr: string;
}

interface RatingChartProps {
  games: ParsedGame[];
  confidence?: Confidence;
}

export default function RatingChart({ games, confidence }: RatingChartProps) {
  const [activeTab, setActiveTab] = useState<'blitz' | 'rapid' | 'bullet'>('blitz');

  const chartData = useMemo(() => {
    return computeRatingHistory(games, activeTab);
  }, [games, activeTab]);

  // Find peak rating in the filtered history
  const peakRating = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.rating));
  }, [chartData]);

  // Current rating in the series
  const currentRating = useMemo(() => {
    if (chartData.length === 0) return 0;
    return chartData[chartData.length - 1].rating;
  }, [chartData]);

  const tabs = [
    { id: 'blitz', label: 'Blitz', icon: Zap, color: 'text-neon-green', border: 'border-neon-green/20' },
    { id: 'rapid', label: 'Rapid', icon: Timer, color: 'text-neon-blue', border: 'border-neon-blue/20' },
    { id: 'bullet', label: 'Bullet', icon: Rocket, color: 'text-neon-red', border: 'border-neon-red/20' },
  ] as const;

  if (chartData.length === 0) {
    return (
      <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center min-h-[350px] text-center">
        <TrendingUp className="h-10 w-10 text-zinc-650 opacity-40 mb-3" />
        <h3 className="font-mono text-sm font-bold text-zinc-500 uppercase tracking-widest">Historical Trends</h3>
        {/* Tab selector even when empty */}
        <div className="flex gap-2 mt-4">
          {tabs.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`rounded-lg px-4 py-2 font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-200 border cursor-pointer ${
                activeTab === id
                  ? 'bg-zinc-800 text-white border-zinc-700'
                  : 'bg-[#0f121d] border-zinc-900 text-zinc-550'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-650 font-mono mt-6">No games parsed for the selected time control</p>
      </div>
    );
  }

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full" style={{ overflow: 'visible' }}>
      {/* Chart Headers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-neon-green" />
              Rating Trajectory
              <span className="group relative flex items-center">
                <Info className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 origin-bottom p-2 bg-[#0c0e16] border border-zinc-800 text-[10px] text-zinc-400 rounded-lg shadow-xl font-mono normal-case tracking-normal z-50 text-center font-normal">
                  Metrics and ratings are for standard chess games only.
                </span>
              </span>
            </h4>
            {confidence && (
              <span className={`inline-flex items-center gap-1 rounded bg-zinc-950 border border-zinc-900 px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                confidence.tier === 'HIGH' ? 'text-neon-green border-neon-green/30' : confidence.tier === 'MEDIUM' ? 'text-neon-blue border-neon-blue/30' : 'text-neon-red border-neon-red/30'
              }`} title={confidence.coverageStr}>
                {confidence.tier} CONFIDENCE
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Time-series tracking player performance ratings</p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2">
          {tabs.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-200 border cursor-pointer ${
                activeTab === id
                  ? 'bg-zinc-800 text-white border-zinc-700 shadow-md'
                  : 'bg-[#0f121d] border-zinc-900 text-zinc-500 hover:border-zinc-850 hover:text-zinc-350'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${color}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-[#0c0e16]">
            <Award className="h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">Peak rating</span>
            <p className="font-sans text-base font-extrabold text-white leading-tight">{peakRating}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-[#0c0e16]">
            <TrendingUp className="h-4 w-4 text-neon-green" />
          </div>
          <div>
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">Current Rating</span>
            <p className="font-sans text-base font-extrabold text-white leading-tight">{currentRating}</p>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[280px] w-full font-mono text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#10141d" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#475569" 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(date) => {
                try {
                  const [y, m, d] = date.split('-');
                  return `${m}/${d}`;
                } catch {
                  return date;
                }
              }}
            />
            <YAxis 
              stroke="#475569" 
              tickLine={false} 
              axisLine={false} 
              domain={['dataMin - 30', 'dataMax + 30']}
            />
            
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isWin = data.result === 'W';
                  const isLoss = data.result === 'L';
                  const resultColor = isWin ? 'text-neon-green' : isLoss ? 'text-neon-red' : 'text-slate-400';
                  const outcomeText = isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw';

                  return (
                    <div className="rounded-xl border border-zinc-800 bg-[#0f121d]/95 p-4 shadow-xl backdrop-blur-md">
                      <div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                        {data.date}
                      </div>
                      <div className="space-y-1.5 font-sans text-xs">
                        <div className="flex justify-between gap-6">
                          <span className="text-zinc-400">Player rating:</span>
                          <strong className="text-white font-bold">{data.rating}</strong>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-zinc-400">Opponent:</span>
                          <span className="text-zinc-350">{data.opponent} ({data.opponentRating})</span>
                        </div>
                        <div className="flex justify-between gap-6 border-t border-zinc-850 pt-1.5 mt-1.5">
                          <span className="text-zinc-400">Outcome:</span>
                          <strong className={`font-bold ${resultColor}`}>{outcomeText}</strong>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Peak Reference Line */}
            <ReferenceLine 
              y={peakRating} 
              stroke="#eab308" 
              strokeDasharray="3 3" 
              opacity={0.4}
              label={{
                value: `PEAK: ${peakRating}`,
                fill: '#eab308',
                position: 'top',
                fontSize: 8,
                fontFamily: 'monospace'
              }}
            />
            
            <Line
              type="monotone"
              dataKey="rating"
              stroke={
                activeTab === 'blitz'
                  ? '#39ff14'
                  : activeTab === 'rapid'
                  ? '#00e5ff'
                  : '#ff3b30'
              }
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: '#06080d'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
