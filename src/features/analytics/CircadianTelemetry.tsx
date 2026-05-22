'use strict';
'use client';

import React, { useMemo, useState } from 'react';
import { ParsedGame } from '@/types/chess';
import { Info, AlertTriangle, Moon, Award, Calendar, Zap, Activity } from 'lucide-react';

interface CircadianTelemetryProps {
  games: ParsedGame[];
}

interface CellData {
  hour: number;
  day: number;
  count: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CircadianTelemetry({ games }: CircadianTelemetryProps) {
  const [activeTab, setActiveTab] = useState<'activity' | 'performance'>('activity');
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Grid Data Computation (24 hours x 7 days)
  const matrixData = useMemo(() => {
    // 24 rows (hours) of 7 days
    const matrix: CellData[][] = Array.from({ length: 24 }, (_, hour) =>
      Array.from({ length: 7 }, (_, day) => ({
        hour,
        day,
        count: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
      }))
    );

    for (const game of games) {
      if (!game.endTime) continue;

      const date = new Date(game.endTime * 1000);
      const rawDay = date.getDay(); // 0 = Sunday, 1 = Monday, ...
      const dayIndex = (rawDay + 6) % 7; // Convert to: 0 = Mon, 1 = Tue, ..., 6 = Sun
      const hourIndex = date.getHours(); // 0 to 23

      if (hourIndex >= 0 && hourIndex < 24 && dayIndex >= 0 && dayIndex < 7) {
        const cell = matrix[hourIndex][dayIndex];
        cell.count += 1;
        if (game.result === 'W') cell.wins += 1;
        else if (game.result === 'L') cell.losses += 1;
        else cell.draws += 1;
      }
    }

    // Calculate win rates
    for (let h = 0; h < 24; h++) {
      for (let d = 0; d < 7; d++) {
        const cell = matrix[h][d];
        if (cell.count > 0) {
          cell.winRate = parseFloat(((cell.wins / cell.count) * 100).toFixed(1));
        }
      }
    }

    return matrix;
  }, [games]);

  // Behavioral Intelligence Calculations
  const insights = useMemo(() => {
    let dayGames = 0;
    let dayWins = 0;
    let nightGames = 0;
    let nightWins = 0;

    const dayStats = Array.from({ length: 7 }, (_, idx) => ({
      dayIndex: idx,
      count: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    }));

    const sessionBins = {
      morning: { name: 'Morning Session', hours: [5, 6, 7, 8, 9, 10, 11], count: 0, wins: 0 },
      afternoon: { name: 'Afternoon Session', hours: [12, 13, 14, 15, 16], count: 0, wins: 0 },
      evening: { name: 'Evening Combat', hours: [17, 18, 19, 20], count: 0, wins: 0 },
      night: { name: 'Night Ops', hours: [21, 22, 23, 0], count: 0, wins: 0 },
      lateNight: { name: 'Late-Night Vigil', hours: [1, 2, 3, 4], count: 0, wins: 0 },
    };

    for (const game of games) {
      if (!game.endTime) continue;
      const date = new Date(game.endTime * 1000);
      const hour = date.getHours();
      const rawDay = date.getDay();
      const dayIndex = (rawDay + 6) % 7;

      // Group for tilt: Late-night (12am-5am) vs Day (8am-10pm)
      if (hour >= 0 && hour < 5) {
        nightGames++;
        if (game.result === 'W') nightWins++;
      } else if (hour >= 8 && hour <= 21) {
        dayGames++;
        if (game.result === 'W') dayWins++;
      }

      // Day of week stats
      if (dayIndex >= 0 && dayIndex < 7) {
        const stats = dayStats[dayIndex];
        stats.count++;
        if (game.result === 'W') stats.wins++;
        else if (game.result === 'L') stats.losses++;
        else stats.draws++;
      }

      // Session type bins
      for (const bin of Object.values(sessionBins)) {
        if (bin.hours.includes(hour)) {
          bin.count++;
          if (game.result === 'W') bin.wins++;
        }
      }
    }

    // 1. Circadian Tilt
    const dayWinRate = dayGames > 0 ? (dayWins / dayGames) * 100 : 0;
    const nightWinRate = nightGames > 0 ? (nightWins / nightGames) * 100 : 0;
    const tiltDiff = dayWinRate - nightWinRate;
    let tiltStatus: 'alert' | 'healthy' | 'neutral' = 'neutral';
    let tiltDescription = 'Insufficient late-night games for a reliable profile.';

    if (nightGames >= 8) {
      if (tiltDiff > 4) {
        tiltStatus = 'alert';
        tiltDescription = `⚠ HIGH TILT DETECTED: Performance deteriorates significantly after midnight. Win rate drops to ${nightWinRate.toFixed(1)}% compared to ${dayWinRate.toFixed(1)}% in daylight.`;
      } else if (tiltDiff < -3) {
        tiltStatus = 'healthy';
        tiltDescription = `⚡ NIGHT OWL PROFILE: Focus enhances during late-night hours. Late-night win rate is ${nightWinRate.toFixed(1)}% (+${Math.abs(tiltDiff).toFixed(1)}% boost).`;
      } else {
        tiltStatus = 'neutral';
        tiltDescription = `✓ STABLE BIO-RHYTHMS: Performance remains consistent between daytime (${dayWinRate.toFixed(1)}%) and midnight (${nightWinRate.toFixed(1)}%) sessions.`;
      }
    }

    // 2. Day Classification
    const validDays = dayStats.filter(d => d.count >= 5);
    let bestDayName = 'Insufficient Data';
    let bestDayRate = 0;
    let worstDayName = 'Insufficient Data';
    let worstDayRate = 100;

    if (validDays.length > 0) {
      const sortedByPerformance = [...validDays].sort((a, b) => (b.wins / b.count) - (a.wins / a.count));
      const best = sortedByPerformance[0];
      const worst = sortedByPerformance[sortedByPerformance.length - 1];

      bestDayName = DAY_LABELS[best.dayIndex];
      bestDayRate = (best.wins / best.count) * 100;

      worstDayName = DAY_LABELS[worst.dayIndex];
      worstDayRate = (worst.wins / worst.count) * 100;
    } else if (games.length > 0) {
      // fallback without minimum threshold
      const sortedByPerformance = [...dayStats].filter(d => d.count > 0).sort((a, b) => (b.wins / b.count) - (a.wins / a.count));
      if (sortedByPerformance.length > 0) {
        const best = sortedByPerformance[0];
        const worst = sortedByPerformance[sortedByPerformance.length - 1];
        bestDayName = DAY_LABELS[best.dayIndex];
        bestDayRate = (best.wins / best.count) * 100;
        worstDayName = DAY_LABELS[worst.dayIndex];
        worstDayRate = (worst.wins / worst.count) * 100;
      }
    }

    // 3. Primary Combat Window
    const sortedBins = Object.entries(sessionBins).sort((a, b) => b[1].count - a[1].count);
    const primaryBinKey = sortedBins[0][0];
    const primaryBin = sortedBins[0][1];

    let windowLabel = 'N/A';
    let windowDesc = 'Telemetry scanning in progress.';

    if (primaryBin.count > 0) {
      if (primaryBinKey === 'morning') {
        windowLabel = '05:00 — 12:00';
        windowDesc = 'Subject operates primarily in morning hours. Biorhythms indicate higher opening stability and fresh memory conversion.';
      } else if (primaryBinKey === 'afternoon') {
        windowLabel = '12:00 — 17:00';
        windowDesc = 'Mid-day operational focus. Core tactical speed matches general population baselines.';
      } else if (primaryBinKey === 'evening') {
        windowLabel = '17:00 — 21:00';
        windowDesc = 'Peak evening density. Tactical volatility is standard, showing balanced structural stamina.';
      } else if (primaryBinKey === 'night') {
        windowLabel = '21:00 — 01:00';
        windowDesc = 'Late night battle ops. Higher volume of quick tactical encounters and slightly elevated chaos index.';
      } else {
        windowLabel = '01:00 — 05:00';
        windowDesc = 'Grave-shift battle window. Volatile sleep patterns increase risk of tactical blindness.';
      }
    }

    return {
      tiltStatus,
      tiltDescription,
      bestDayName,
      bestDayRate,
      worstDayName,
      worstDayRate,
      primarySessionName: primaryBin.name,
      primarySessionRange: windowLabel,
      primarySessionDesc: windowDesc,
      primarySessionCount: primaryBin.count,
    };
  }, [games]);

  // Color mappings
  const getActivityColor = (count: number) => {
    if (count === 0) return 'bg-[#0a0d14] border-zinc-950';
    if (count <= 2) return 'bg-neon-green/10 border-neon-green/20';
    if (count <= 5) return 'bg-neon-green/30 border-neon-green/45';
    if (count <= 9) return 'bg-neon-green/55 border-neon-green/70 shadow-[0_0_4px_rgba(57,255,20,0.15)]';
    return 'bg-neon-green border-white shadow-[0_0_8px_#39ff14] text-black font-extrabold';
  };

  const getPerformanceColor = (cell: CellData) => {
    if (cell.count === 0) return 'bg-[#0a0d14] border-zinc-950';
    const rate = cell.winRate;
    if (rate < 35) return 'bg-neon-red/60 border-neon-red/80 shadow-[0_0_4px_rgba(255,59,48,0.2)]';
    if (rate < 46) return 'bg-neon-red/20 border-neon-red/30';
    if (rate < 53) return 'bg-zinc-800 border-zinc-700';
    if (rate < 62) return 'bg-neon-blue/30 border-neon-blue/45';
    if (rate < 72) return 'bg-neon-green/40 border-neon-green/55';
    return 'bg-neon-green border-white shadow-[0_0_8px_#39ff14] text-black font-extrabold';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const handleCellHover = (e: React.MouseEvent<HTMLDivElement>, cell: CellData) => {
    if (cell.count === 0) {
      setHoveredCell(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.parentElement?.parentElement?.getBoundingClientRect();

    if (parentRect) {
      setHoverPos({
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top - 8,
      });
    }
    setHoveredCell(cell);
  };

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full" style={{ overflow: 'visible' }}>
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-neon-green" />
              OPERATIONAL ACTIVITY MATRIX
              <span className="group relative flex items-center">
                <Info className="h-3.5 w-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors" />
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 origin-bottom p-2 bg-[#0c0e16] border border-zinc-800 text-[10px] text-zinc-400 rounded-lg shadow-xl font-mono normal-case tracking-normal z-50 text-center font-normal">
                  Metrics and maps are derived from standard chess games only.
                </span>
              </span>
            </h4>
            <span className="rounded border border-neon-green/30 bg-neon-green/5 px-2 py-0.5 font-mono text-[8px] font-bold text-neon-green uppercase animate-pulse">
              CIRCADIAN SCAN ACTIVE
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Time-based circadian behavior and performance diagnostics</p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 border cursor-pointer ${
              activeTab === 'activity'
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-md'
                : 'bg-[#0f121d] border-zinc-900 text-zinc-500 hover:border-zinc-850 hover:text-zinc-350'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-neon-green" />
            <span>Activity Grid</span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-wider uppercase transition-all duration-200 border cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-zinc-800 text-white border-zinc-700 shadow-md'
                : 'bg-[#0f121d] border-zinc-900 text-zinc-500 hover:border-zinc-850 hover:text-zinc-350'
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-neon-blue" />
            <span>Performance Heatmap</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="relative w-full overflow-x-auto pb-4 scrollbar-thin select-none">
        <div className="min-w-[650px] pr-2">
          {/* Weekday columns labels row */}
          <div className="flex pl-16 mb-2">
            {DAY_LABELS.map((day) => (
              <div key={day} className="flex-1 text-center font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Hour rows */}
          <div className="flex flex-col gap-[3px]">
            {matrixData.map((row, hourIndex) => (
              <div key={hourIndex} className="flex items-center">
                {/* Hour label */}
                <div className="w-16 font-mono text-[10px] text-zinc-550 text-right pr-4 shrink-0 font-semibold">
                  {formatHour(hourIndex)}
                </div>

                {/* Day blocks */}
                <div className="flex-1 flex gap-[3px]">
                  {row.map((cell, dayIndex) => {
                    const cellColor =
                      activeTab === 'activity'
                        ? getActivityColor(cell.count)
                        : getPerformanceColor(cell);

                    return (
                      <div
                        key={dayIndex}
                        onMouseEnter={(e) => handleCellHover(e, cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`flex-1 h-5 rounded-[3px] border border-zinc-900/60 transition-all duration-200 cursor-crosshair relative overflow-hidden group ${cellColor}`}
                      >
                        {/* Tactical Scan Line effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Premium Portal Hover Tooltip */}
        {hoveredCell && (
          <div
            className="absolute rounded-xl border border-zinc-800 bg-[#07090f]/95 p-3.5 shadow-2xl backdrop-blur-md z-50 pointer-events-none transition-opacity duration-150 flex flex-col gap-1 w-52 font-mono text-[10px] text-zinc-400"
            style={{
              left: `${hoverPos.x}px`,
              top: `${hoverPos.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold text-white border-b border-zinc-900 pb-1.5 mb-1.5 uppercase flex justify-between">
              <span>{DAY_LABELS[hoveredCell.day]}</span>
              <span className="text-zinc-500 font-semibold">{formatHour(hoveredCell.hour)}</span>
            </div>
            <div className="flex justify-between">
              <span>Battles:</span>
              <strong className="text-white font-extrabold">{hoveredCell.count}</strong>
            </div>
            <div className="flex justify-between">
              <span>Win Rate:</span>
              <strong className={hoveredCell.winRate >= 50 ? 'text-neon-green' : 'text-neon-red'}>
                {hoveredCell.winRate}%
              </strong>
            </div>
            <div className="flex justify-between text-[9px] text-zinc-550 mt-1 border-t border-zinc-900 pt-1.5">
              <span>Record:</span>
              <span>
                W:<strong className="text-neon-green font-bold">{hoveredCell.wins}</strong> | 
                D:<strong className="text-zinc-400 font-bold">{hoveredCell.draws}</strong> | 
                L:<strong className="text-neon-red font-bold">{hoveredCell.losses}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Grid Legend & Map Scale */}
      <div className="flex flex-wrap items-center justify-between border-t border-zinc-900 pt-4 gap-4">
        {activeTab === 'activity' ? (
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-550">
            <span>Operational Density Scale:</span>
            <span>Low</span>
            <div className="h-3 w-3 rounded-sm border border-zinc-950 bg-[#0a0d14]" />
            <div className="h-3 w-3 rounded-sm border border-neon-green/20 bg-neon-green/10" />
            <div className="h-3 w-3 rounded-sm border border-neon-green/45 bg-neon-green/30" />
            <div className="h-3 w-3 rounded-sm border border-neon-green/70 bg-neon-green/55" />
            <div className="h-3 w-3 rounded-sm border border-white bg-neon-green shadow-[0_0_5px_#39ff14]" />
            <span>High Density</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-zinc-550">
            <span>Combat Performance Ratio:</span>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm border border-neon-red/80 bg-neon-red/60" />
              <span>Loss-Prone (&lt;35%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm border border-neon-red/30 bg-neon-red/20" />
              <span>Suboptimal (&lt;46%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm border border-zinc-700 bg-zinc-800" />
              <span>Neutral (46-52%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm border border-neon-blue/45 bg-neon-blue/30" />
              <span>Favorable (53-62%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm border border-neon-green/55 bg-neon-green/40" />
              <span>Dominant (62-72%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm border border-white bg-neon-green shadow-[0_0_5px_#39ff14]" />
              <span>Invincible (&gt;72%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Behavioral Intelligence Insights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-zinc-900 pt-6 mt-2">
        {/* Item 3: Circadian Tilt Warning */}
        <div className="rounded-xl border border-zinc-900 bg-[#07090f]/70 p-4.5 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-zinc-450" />
              CIRCADIAN TILT DIAGNOSTIC
            </span>
            <div className="mt-3.5">
              {insights.tiltStatus === 'alert' ? (
                <div className="flex gap-2.5 items-start">
                  <AlertTriangle className="h-5 w-5 text-neon-red shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <span className="rounded bg-neon-red/10 border border-neon-red/35 px-1.5 py-0.5 font-mono text-[8px] font-black text-neon-red uppercase tracking-wider">
                      HIGH TILT DETECTED
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed pt-1">
                      {insights.tiltDescription}
                    </p>
                  </div>
                </div>
              ) : insights.tiltStatus === 'healthy' ? (
                <div className="flex gap-2.5 items-start">
                  <Zap className="h-5 w-5 text-neon-green shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="rounded bg-neon-green/10 border border-neon-green/35 px-1.5 py-0.5 font-mono text-[8px] font-black text-neon-green uppercase tracking-wider">
                      ACTIVE ADVANTAGE
                    </span>
                    <p className="text-[11px] text-zinc-300 font-sans leading-relaxed pt-1">
                      {insights.tiltDescription}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5 items-start opacity-75">
                  <Info className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-mono text-[8px] text-zinc-500 uppercase tracking-wider">
                      NEUTRAL READOUT
                    </span>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed pt-1">
                      {insights.tiltDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Item 4: Day Classification */}
        <div className="rounded-xl border border-zinc-900 bg-[#07090f]/70 p-4.5 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-zinc-450" />
              TEMPORAL EFFICIENCY CLASSIFICATION
            </span>
            <div className="mt-4 space-y-3 font-mono text-[10px]">
              <div className="flex justify-between items-center border-b border-zinc-950 pb-2">
                <span className="text-zinc-500 uppercase">BEST PERFORMANCE DAY:</span>
                <span className="text-neon-green font-extrabold">
                  {insights.bestDayName} {insights.bestDayRate > 0 && `(${insights.bestDayRate.toFixed(1)}%)`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 uppercase">LOWEST STABILITY:</span>
                <span className="text-neon-red font-extrabold">
                  {insights.worstDayName} {insights.worstDayRate < 100 && `(${insights.worstDayRate.toFixed(1)}%)`}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-zinc-550 font-sans leading-relaxed pt-3 mt-3 border-t border-zinc-900/60">
            Computed dynamically based on weekly win frequency telemetry.
          </p>
        </div>

        {/* Item 5: Session Type Detection */}
        <div className="rounded-xl border border-zinc-900 bg-[#07090f]/70 p-4.5 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-zinc-450" />
              SESSION DENSITY SIGNATURE
            </span>
            <div className="mt-3.5 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-xs font-black text-white uppercase">{insights.primarySessionName}</span>
                <span className="font-mono text-[9px] text-neon-blue font-bold">({insights.primarySessionRange})</span>
              </div>
              <p className="text-[11px] text-zinc-300 font-sans leading-relaxed pt-1.5">
                {insights.primarySessionDesc}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 pt-3 mt-3 border-t border-zinc-900/60">
            <span>ENGAGEMENT VOLUME:</span>
            <span className="text-white font-bold">{insights.primarySessionCount} games logged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
