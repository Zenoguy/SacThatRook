'use strict';
'use client';

import React, { useMemo } from 'react';
import { ParsedGame } from '@/types/chess';
import { Calendar, HelpCircle } from 'lucide-react';

interface ActivityHeatmapProps {
  games: ParsedGame[];
}

export default function ActivityHeatmap({ games }: ActivityHeatmapProps) {
  // Compute counts per date string (YYYY-MM-DD)
  const activityMap = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const game of games) {
      if (game.dateStr) {
        counts[game.dateStr] = (counts[game.dateStr] || 0) + 1;
      }
    }
    return counts;
  }, [games]);

  // Generate date grid for the last 14 weeks (98 days) ending on today
  const gridData = useMemo(() => {
    const weeks: { dateStr: string; count: number; dayOfWeek: number; monthLabel?: string }[][] = [];
    const today = new Date();
    
    // Find the current Sunday to align the grid columns
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday...
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - currentDay)); // Pad to Saturday

    // Total 14 weeks
    const totalDays = 14 * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    let currentDate = new Date(startDate);
    let currentWeek: typeof weeks[number] = [];

    for (let i = 0; i < totalDays; i++) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const count = activityMap[dateStr] || 0;
      const dayOfWeek = currentDate.getDay();

      // Determine month labels (only on the first day of the month or beginning of week)
      let monthLabel: string | undefined;
      if (currentDate.getDate() === 1 || (i % 7 === 0 && currentDate.getDate() <= 7)) {
        monthLabel = currentDate.toLocaleDateString('en-US', { month: 'short' });
      }

      currentWeek.push({
        dateStr,
        count,
        dayOfWeek,
        monthLabel
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      // Increment day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return weeks;
  }, [activityMap]);

  // Helper to determine neon intensity colors
  const getGlowLevel = (count: number) => {
    if (count === 0) return 'bg-[#0f121d] border-[#1e293b]/50';
    if (count <= 2) return 'bg-neon-green/20 border-neon-green/35 text-zinc-400';
    if (count <= 5) return 'bg-neon-green/45 border-neon-green/50 text-zinc-200';
    if (count <= 9) return 'bg-neon-green/70 border-neon-green/80 text-white';
    return 'bg-neon-green border-white text-black shadow-[0_0_12px_#39ff14]';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col gap-5 w-full">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neon-green" />
          Combat Activity Grid
        </h4>
        <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Chronological heat map of battles fought</p>
      </div>

      {/* Grid Layout Canvas */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[650px] flex flex-col gap-2 font-mono text-[9px] text-zinc-500 pl-1 select-none">
          {/* Month Labels row */}
          <div className="flex pl-8">
            {gridData.map((week, wIndex) => {
              const label = week.find(d => d.monthLabel)?.monthLabel;
              return (
                <div key={wIndex} className="w-[18px] text-center font-bold tracking-tighter text-[8px]">
                  {label || ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            {/* Day of Week Labels col */}
            <div className="flex flex-col justify-between py-1 h-[130px] w-6 text-[8px] font-bold text-zinc-500">
              <span>Sun</span>
              <span>Tue</span>
              <span>Thu</span>
              <span>Sat</span>
            </div>

            {/* Weeks columns */}
            <div className="flex gap-[4px]">
              {gridData.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-[4px] h-[130px] justify-between">
                  {week.map((day) => (
                    <div
                      key={day.dateStr}
                      className={`h-[15px] w-[15px] rounded-[3px] border transition-all duration-200 cursor-help ${getGlowLevel(
                        day.count
                      )}`}
                      title={`${day.count} games on ${day.dateStr}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Block */}
      <div className="flex flex-wrap items-center justify-between border-t border-zinc-900 pt-4 gap-4">
        {/* Heat Map Key */}
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-550">
          <span>Fewer</span>
          <div className="h-[12px] w-[12px] rounded-[2px] border border-[#1e293b]/50 bg-[#0f121d]" />
          <div className="h-[12px] w-[12px] rounded-[2px] border border-neon-green/35 bg-neon-green/20" />
          <div className="h-[12px] w-[12px] rounded-[2px] border border-neon-green/50 bg-neon-green/45" />
          <div className="h-[12px] w-[12px] rounded-[2px] border border-neon-green/80 bg-neon-green/70" />
          <div className="h-[12px] w-[12px] rounded-[2px] border border-white bg-neon-green shadow-[0_0_5px_#39ff14]" />
          <span>More</span>
        </div>

        {/* Quick descriptive text */}
        <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-500">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Showing the most recent 14 weeks of competitive telemetry</span>
        </div>
      </div>
    </div>
  );
}
