'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import { ParsedGame } from '@/types/chess';
import { 
  Swords, 
  Shield, 
  Activity, 
  Zap, 
  Rocket, 
  Timer, 
  Sun, 
  Layers, 
  Info, 
  AlertTriangle, 
  Flame, 
  Skull, 
  Compass, 
  Sparkles,
  Trophy,
  Brain
} from 'lucide-react';

interface Confidence {
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  gamesAnalyzed: number;
  yearsCount: number;
  coverageStr: string;
}

interface OpeningIntelligenceProps {
  games: ParsedGame[];
  confidence?: Confidence;
}

// Type definitions for internal metrics processing
interface FamilyStat {
  name: string;
  eco: string;
  gamesCount: number;
  wins: number;
  losses: number;
  draws: number;
  score: number; // (wins + 0.5 * draws) / gamesCount * 100
  winRate: number; // wins / gamesCount * 100
  avgMoves: number;
  whiteGames: number;
  blackGames: number;
}

export default function OpeningIntelligence({ games, confidence }: OpeningIntelligenceProps) {
  // Global filter for Game Mode
  const [timeClassFilter, setTimeClassFilter] = useState<'ALL' | 'bullet' | 'blitz' | 'rapid' | 'daily'>('ALL');

  // Local card filters for perspective (All / White / Black)
  const [repertoirePerspective, setRepertoirePerspective] = useState<'ALL' | 'white' | 'black'>('ALL');
  const [weaknessPerspective, setWeaknessPerspective] = useState<'ALL' | 'white' | 'black'>('ALL');
  const [antiRepertoirePerspective, setAntiRepertoirePerspective] = useState<'ALL' | 'white' | 'black'>('ALL');

  // Filter games based on global game mode selection
  const modeFilteredGames = useMemo(() => {
    if (timeClassFilter === 'ALL') return games;
    return games.filter(g => g.timeClass === timeClassFilter);
  }, [games, timeClassFilter]);

  // General opening family aggregation function
  const computeFamilyStats = (gamesList: ParsedGame[]) => {
    const families: Record<string, {
      name: string;
      ecos: Record<string, number>;
      gamesCount: number;
      wins: number;
      losses: number;
      draws: number;
      totalMovesCount: number;
      whiteGames: number;
      blackGames: number;
    }> = {};

    for (const g of gamesList) {
      if (!g.openingName || g.openingName === 'Unknown Opening') continue;
      
      // Extract base family (split by colon, dash, comma)
      const name = g.openingName.split(/[:,-]/)[0].trim();
      if (!families[name]) {
        families[name] = {
          name,
          ecos: {},
          gamesCount: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          totalMovesCount: 0,
          whiteGames: 0,
          blackGames: 0,
        };
      }
      
      const fam = families[name];
      fam.gamesCount += 1;
      fam.ecos[g.eco] = (fam.ecos[g.eco] || 0) + 1;
      fam.totalMovesCount += g.movesCount;
      if (g.playerColor === 'white') fam.whiteGames += 1;
      else fam.blackGames += 1;

      if (g.result === 'W') fam.wins += 1;
      else if (g.result === 'L') fam.losses += 1;
      else fam.draws += 1;
    }

    return Object.values(families).map(f => {
      let bestEco = 'Unknown';
      let maxEcoCount = -1;
      for (const [eco, count] of Object.entries(f.ecos)) {
        if (count > maxEcoCount) {
          maxEcoCount = count;
          bestEco = eco;
        }
      }

      const score = f.gamesCount > 0 ? ((f.wins + 0.5 * f.draws) / f.gamesCount) * 100 : 0;
      const winRate = f.gamesCount > 0 ? (f.wins / f.gamesCount) * 100 : 0;
      const avgMoves = f.gamesCount > 0 ? Math.round(f.totalMovesCount / f.gamesCount) : 0;

      return {
        name: f.name,
        eco: bestEco,
        gamesCount: f.gamesCount,
        wins: f.wins,
        losses: f.losses,
        draws: f.draws,
        score: parseFloat(score.toFixed(1)),
        winRate: parseFloat(winRate.toFixed(1)),
        avgMoves,
        whiteGames: f.whiteGames,
        blackGames: f.blackGames,
      };
    }).sort((a, b) => b.gamesCount - a.gamesCount);
  };

  // Compile stats for all games in the current game mode
  const allFamilies = useMemo(() => {
    return computeFamilyStats(modeFilteredGames);
  }, [modeFilteredGames]);

  // MODULE 1: OPENING DNA COMPUTATIONS (based on global game mode selection)
  const dnaMetrics = useMemo(() => {
    if (modeFilteredGames.length === 0 || allFamilies.length === 0) return null;

    // 1. Signature Weapon = Most played opening family
    const signature = allFamilies[0];

    // 2. Comfort Systems = Top win rate/score families with at least 3 games (excluding signature)
    const comfortThreshold = Math.max(2, Math.min(5, Math.round(modeFilteredGames.length * 0.04)));
    const comfortOptions = allFamilies
      .filter(f => f.gamesCount >= comfortThreshold && f.name !== signature.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    // 3. Structural Preference (Open vs Closed)
    const openGames = modeFilteredGames.filter(g => g.eco.startsWith('B') || g.eco.startsWith('C')).length;
    const closedGames = modeFilteredGames.length - openGames;
    const openPct = Math.round((openGames / modeFilteredGames.length) * 100);
    const closedPct = 100 - openPct;

    // 4. Repertoire Diversity
    const top3Count = allFamilies.slice(0, 3).reduce((sum, f) => sum + f.gamesCount, 0);
    const top3Ratio = Math.round((top3Count / modeFilteredGames.length) * 100);

    return {
      signature,
      comfortOptions,
      openPct,
      closedPct,
      top3Ratio,
    };
  }, [modeFilteredGames, allFamilies]);

  // MODULE 3: TACTICAL PROFILE COMPUTATIONS (based on global game mode selection)
  const tacticalProfile = useMemo(() => {
    const total = modeFilteredGames.length;
    if (total === 0) return null;

    // Draw rate
    const draws = modeFilteredGames.filter(g => g.result === 'D').length;
    const drawRate = (draws / total) * 100;

    // Open positions percentage
    const openGames = modeFilteredGames.filter(g => g.eco.startsWith('B') || g.eco.startsWith('C')).length;
    const openPct = (openGames / total) * 100;

    // Short decisive games (<= 22 moves, W or L result)
    const shortDecisive = modeFilteredGames.filter(g => g.movesCount <= 22 && g.result !== 'D').length;
    const shortDecisiveRate = (shortDecisive / total) * 100;

    // Long games (>= 35 moves)
    const longGames = modeFilteredGames.filter(g => g.movesCount >= 35).length;
    const longGamesRate = (longGames / total) * 100;

    // 1. Draw Resistance: how aggressively they avoid draws
    const drawResistance = Math.round(100 - drawRate);

    // 2. Aggression Score: draw avoidance, open structures, short games
    const aggression = Math.min(99, Math.max(12, Math.round(
      (100 - drawRate) * 0.4 + openPct * 0.3 + shortDecisiveRate * 2.5
    )));

    // 3. Chaos Index: volatility, short games, draw avoidance
    const chaos = Math.min(99, Math.max(10, Math.round(
      shortDecisiveRate * 3.5 + (100 - drawRate) * 0.25 + (openPct > 55 ? 10 : 0)
    )));

    // 4. Positional Stability: closed structures, long games, draw rates
    const positional = Math.min(99, Math.max(10, Math.round(
      (100 - openPct) * 0.4 + longGamesRate * 0.4 + drawRate * 1.5
    )));

    return {
      aggression,
      chaos,
      drawResistance,
      positional,
    };
  }, [modeFilteredGames]);

  // Helpers to get filtered list of families by perspective (All / White / Black)
  const getPerspectiveFamilies = (perspective: 'ALL' | 'white' | 'black') => {
    let filteredList = modeFilteredGames;
    if (perspective !== 'ALL') {
      filteredList = modeFilteredGames.filter(g => g.playerColor === perspective);
    }
    return computeFamilyStats(filteredList);
  };

  // MODULE 2: REPERTOIRE (Popular & Best Openings)
  const repertoireData = useMemo(() => {
    const pFamilies = getPerspectiveFamilies(repertoirePerspective);
    const popular = pFamilies.slice(0, 3);
    
    // Best: sorted by score, min games threshold to avoid 100% win rate on 1 game
    const minGames = pFamilies.length > 5 ? 3 : 1;
    const best = pFamilies
      .filter(f => f.gamesCount >= minGames)
      .sort((a, b) => b.score - a.score || b.gamesCount - a.gamesCount)
      .slice(0, 3);

    return { popular, best };
  }, [modeFilteredGames, repertoirePerspective]);

  // MODULE 4: WEAKNESSES (Worst & Collapse Warnings)
  const weaknessesData = useMemo(() => {
    const pFamilies = getPerspectiveFamilies(weaknessPerspective);
    
    // Worst: sorted by score ascending, min games threshold
    const minGames = pFamilies.length > 5 ? 2 : 1;
    const worst = pFamilies
      .filter(f => f.gamesCount >= minGames)
      .sort((a, b) => a.score - b.score || b.gamesCount - a.gamesCount)
      .slice(0, 3);

    // Collapse warning: Look at loss rate in long games (moves >= 25)
    // Find opening family with highest ratio of long losses
    const longLossOpenings: Record<string, {
      name: string;
      totalGames: number;
      losses: number;
      longLosses: number;
      totalLossMoves: number;
    }> = {};

    let targetGames = modeFilteredGames;
    if (weaknessPerspective !== 'ALL') {
      targetGames = modeFilteredGames.filter(g => g.playerColor === weaknessPerspective);
    }

    for (const g of targetGames) {
      if (!g.openingName || g.openingName === 'Unknown Opening') continue;
      const name = g.openingName.split(/[:,-]/)[0].trim();
      
      if (!longLossOpenings[name]) {
        longLossOpenings[name] = { name, totalGames: 0, losses: 0, longLosses: 0, totalLossMoves: 0 };
      }
      const item = longLossOpenings[name];
      item.totalGames += 1;
      
      if (g.result === 'L') {
        item.losses += 1;
        item.totalLossMoves += g.movesCount;
        if (g.movesCount >= 25) {
          item.longLosses += 1;
        }
      }
    }

    const collapseCandidates = Object.values(longLossOpenings)
      .filter(item => item.totalGames >= 3 && item.losses >= 2)
      .map(item => {
        const collapseRatio = item.longLosses / item.totalGames;
        const avgLossMoves = Math.round(item.totalLossMoves / item.losses);
        return {
          name: item.name,
          ratio: collapseRatio,
          avgLossMoves: avgLossMoves > 0 ? avgLossMoves : 20,
          totalGames: item.totalGames,
        };
      })
      .sort((a, b) => b.ratio - a.ratio);

    const collapseWarning = collapseCandidates.length > 0 && collapseCandidates[0].ratio >= 0.25 
      ? collapseCandidates[0] 
      : null;

    return { worst, collapseWarning };
  }, [modeFilteredGames, weaknessPerspective]);

  // MODULE 5: ANTI-REPERTOIRE (Fear Openings & Hidden Weapons)
  const antiRepertoireData = useMemo(() => {
    const pFamilies = getPerspectiveFamilies(antiRepertoirePerspective);

    // Hidden Weapons: rare openings (2-4 games) with high success rate
    const hidden = pFamilies
      .filter(f => f.gamesCount >= 2 && f.gamesCount <= 4 && f.score >= 70)
      .sort((a, b) => b.score - a.score || b.gamesCount - a.gamesCount)
      .slice(0, 2);

    // Fear Openings: opponent opening systems they struggle against
    // Let's look at games where opponent chooses the opening (or general games) and win rate is poor
    const fear = pFamilies
      .filter(f => f.gamesCount >= 2 && f.score < 40)
      .sort((a, b) => a.score - b.score || b.gamesCount - a.gamesCount)
      .slice(0, 2);

    return { hidden, fear };
  }, [modeFilteredGames, antiRepertoirePerspective]);

  // Renders the horizontal win/draw/loss stacked bar
  const renderScoreBar = (win: number, draw: number, loss: number, total: number) => {
    const winPct = total > 0 ? (win / total) * 100 : 0;
    const drawPct = total > 0 ? (draw / total) * 100 : 0;
    const lossPct = total > 0 ? (loss / total) * 100 : 0;

    return (
      <div className="space-y-1 w-full font-mono text-[9px]">
        {/* Ratios progress bar */}
        <div className="relative h-1.5 flex w-full overflow-hidden rounded-full bg-zinc-900 border border-zinc-950">
          <div className="h-full bg-neon-green" style={{ width: `${winPct}%` }} title={`Wins: ${win} (${winPct.toFixed(0)}%)`} />
          <div className="h-full bg-slate-500" style={{ width: `${drawPct}%` }} title={`Draws: ${draw} (${drawPct.toFixed(0)}%)`} />
          <div className="h-full bg-neon-red" style={{ width: `${lossPct}%` }} title={`Losses: ${loss} (${lossPct.toFixed(0)}%)`} />
        </div>
        
        {/* Label readout */}
        <div className="flex justify-between text-zinc-500 tracking-wider">
          <span className="text-neon-green/90 font-semibold">{winPct.toFixed(0)}% W ({win})</span>
          <span>{drawPct.toFixed(0)}% D ({draw})</span>
          <span className="text-neon-red/90 font-semibold">{lossPct.toFixed(0)}% L ({loss})</span>
        </div>
      </div>
    );
  };

  // Render game mode filter button
  const renderModeButton = (mode: 'ALL' | 'bullet' | 'blitz' | 'rapid' | 'daily', label: string, Icon: any) => {
    const isActive = timeClassFilter === mode;
    return (
      <button
        onClick={() => setTimeClassFilter(mode)}
        className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
          isActive
            ? 'bg-neon-green text-black border-neon-green shadow-[0_0_12px_rgba(57,255,20,0.25)]'
            : 'border-zinc-800 bg-[#0a0d14] text-zinc-400 hover:border-zinc-650 hover:text-white'
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </button>
    );
  };

  // Render subcard perspective filter button
  const renderPerspectiveSelector = (value: 'ALL' | 'white' | 'black', onChange: (v: 'ALL' | 'white' | 'black') => void) => {
    return (
      <div className="flex rounded-md bg-zinc-950 border border-zinc-900 p-0.5 font-mono text-[8px]">
        {(['ALL', 'white', 'black'] as const).map(color => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`rounded px-2.5 py-0.5 font-bold uppercase tracking-widest transition-all cursor-pointer ${
              value === color
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            {color === 'ALL' ? 'ALL' : color}
          </button>
        ))}
      </div>
    );
  };

  // Render tactical meter
  const renderTacticalMeter = (title: string, value: number, description: string, colorClass: string, shadowClass: string) => {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline font-mono">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{title}</span>
          <span className={`text-sm font-black ${colorClass}`}>{value}%</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-zinc-950 border border-zinc-900 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass} ${shadowClass}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <p className="text-[9px] text-zinc-500 font-sans leading-relaxed">{description}</p>
      </div>
    );
  };

  if (games.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 w-full">
      {/* Primary Section Header & Global Game Mode Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-mono text-base font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
              <Compass className="h-5 w-5 text-neon-green" />
              OPENING STRATEGY
            </h3>
            {confidence && (
              <span className={`inline-flex items-center gap-1 rounded bg-zinc-950 border border-zinc-900 px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                confidence.tier === 'HIGH' ? 'text-neon-green border-neon-green/30' : confidence.tier === 'MEDIUM' ? 'text-neon-blue border-neon-blue/30' : 'text-neon-red border-neon-red/30'
              }`} title={confidence.coverageStr}>
                {confidence.tier} CONFIDENCE
              </span>
            )}
          </div>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
            Tactical DNA analytics & positional comfort classification
          </p>
        </div>

        {/* Global Game Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {renderModeButton('ALL', 'All Modes', Layers)}
          {renderModeButton('bullet', 'Bullet', Rocket)}
          {renderModeButton('blitz', 'Blitz', Zap)}
          {renderModeButton('rapid', 'Rapid', Timer)}
          {renderModeButton('daily', 'Daily', Sun)}
        </div>
      </div>

      {modeFilteredGames.length === 0 ? (
        <div className="glow-card rounded-2xl p-12 text-center border border-zinc-900 bg-[#0f121d] flex flex-col items-center justify-center gap-3">
          <Info className="h-8 w-8 text-zinc-650" />
          <h5 className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest">No Telemetry Recorded</h5>
          <p className="text-[10px] text-zinc-550 max-w-xs font-mono uppercase tracking-wider">
            No chess games found in your archive played under the {timeClassFilter} format.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ==============================================
              MODULE 1: OPENING DNA (Full-Width Banner)
             ============================================== */}
          {dnaMetrics && (
            <div className="glow-card rounded-2xl border border-zinc-900 bg-[#0a0d14]/65 p-6 md:p-8">
              <div className="flex flex-col gap-1 border-b border-zinc-900 pb-4 mb-6">
                <span className="font-mono text-[9px] font-black uppercase tracking-widest text-neon-green">
                  MODULE 01 // GENETIC DIAGNOSTICS
                </span>
                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-neon-green" />
                  OPENING DNA
                </h4>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* 1. Signature Weapon */}
                <div className="lg:col-span-4 space-y-4">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold flex items-center gap-1">
                    ⚔️ SIGNATURE WEAPON
                  </span>
                  <div className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-4 relative overflow-hidden group">
                    <div className="absolute right-[-10px] top-[-10px] text-neon-green/10 transform rotate-12 scale-150 transition-transform group-hover:rotate-45 duration-700">
                      <Swords className="h-20 w-20" />
                    </div>
                    
                    <span className="rounded bg-neon-green/10 border border-neon-green/30 px-2 py-0.5 font-mono text-[8px] font-extrabold text-neon-green uppercase">
                      {dnaMetrics.signature.eco}
                    </span>
                    <h5 className="font-sans text-base font-extrabold text-white tracking-wide mt-2">
                      {dnaMetrics.signature.name}
                    </h5>

                    <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-xs">
                      <div>
                        <div className="text-[9px] text-zinc-550 uppercase">Score</div>
                        <div className="text-neon-green font-black text-sm">{dnaMetrics.signature.score}%</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-550 uppercase">Games</div>
                        <div className="text-zinc-200 font-black text-sm">{dnaMetrics.signature.gamesCount}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-550 uppercase">Avg Moves</div>
                        <div className="text-zinc-200 font-black text-sm">{dnaMetrics.signature.avgMoves}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Comfort Systems */}
                <div className="lg:col-span-4 space-y-4">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold flex items-center gap-1">
                    🛡️ COMFORT SYSTEMS
                  </span>
                  <div className="space-y-2.5">
                    {dnaMetrics.comfortOptions.length > 0 ? (
                      dnaMetrics.comfortOptions.map(option => (
                        <div key={option.name} className="flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-950/40 p-3">
                          <div className="min-w-0">
                            <span className="rounded bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 font-mono text-[7px] text-neon-blue uppercase">
                              {option.eco}
                            </span>
                            <h6 className="font-sans text-xs font-bold text-zinc-200 truncate mt-1 max-w-[170px]" title={option.name}>
                              {option.name}
                            </h6>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-xs font-black text-neon-blue">{option.score}%</div>
                            <div className="text-[8px] text-zinc-550 uppercase font-semibold">{option.gamesCount} games</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-zinc-900/60 border-dashed p-6 text-center text-[10px] text-zinc-600 font-mono uppercase">
                        Insufficient depth for comfort logs
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Tactical Exposure & Repertoire Concentration */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Open vs Closed positions */}
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold">
                      STRUCTURAL PREFERENCE
                    </span>
                    <div className="relative h-5 w-full rounded bg-zinc-950 border border-zinc-900 overflow-hidden flex font-mono text-[9px] font-bold">
                      {dnaMetrics.openPct > 0 && (
                        <div 
                          className="h-full bg-neon-green/10 border-r border-neon-green/30 text-neon-green flex items-center px-2"
                          style={{ width: `${dnaMetrics.openPct}%` }}
                        >
                          OPEN {dnaMetrics.openPct}%
                        </div>
                      )}
                      {dnaMetrics.closedPct > 0 && (
                        <div 
                          className="h-full bg-zinc-900/40 text-zinc-400 flex items-center justify-end px-2 flex-grow"
                        >
                          CLOSED {dnaMetrics.closedPct}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Repertoire Diversity */}
                  <div className="space-y-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 font-extrabold">
                      REPERTOIRE DIVERSITY
                    </span>
                    <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-3.5">
                      <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                        Player plays the top 3 opening families in <strong className="text-white font-extrabold font-mono">{dnaMetrics.top3Ratio}%</strong> of games.
                      </p>
                      <p className="text-[9px] font-mono text-zinc-550 uppercase mt-1">
                        {dnaMetrics.top3Ratio > 75 
                          ? 'Highly Specialized // Hyper-focused structures' 
                          : dnaMetrics.top3Ratio < 45
                          ? 'Highly Adaptive // Multi-structural variations'
                          : 'Balanced System // standard repertoire rotation'}
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* ==============================================
              2x2 CINEMATIC TELEMETRY GRID
             ============================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* BLOCK 1: REPERTOIRE (Popular & Best Openings) */}
            <div className="glow-card rounded-2xl border border-zinc-900 bg-[#0a0d14]/65 p-6 md:p-8 flex flex-col justify-between">
              
              {/* Header & Controls */}
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-6">
                <div>
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-neon-blue">
                    MODULE 02 // REPERTOIRE
                  </span>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-neon-blue" />
                    REPERTOIRE STRATEGY
                  </h4>
                </div>
                {renderPerspectiveSelector(repertoirePerspective, setRepertoirePerspective)}
              </div>

              {/* Sub-panels (Side-by-side or stacked grid) */}
              <div className="space-y-6">
                
                {/* Popular */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                      Popular Openings
                    </span>
                    <span className="text-[8px] text-zinc-650 font-mono">(Most Played)</span>
                  </div>
                  
                  <div className="space-y-3">
                    {repertoireData.popular.length > 0 ? (
                      repertoireData.popular.map(stat => (
                        <div key={stat.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="rounded bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 font-mono text-[8px] font-extrabold text-neon-blue">
                                {stat.eco}
                              </span>
                              <span className="font-sans font-bold text-zinc-200 truncate max-w-[210px]" title={stat.name}>
                                {stat.name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-zinc-400 flex-shrink-0">{stat.gamesCount} games</span>
                          </div>
                          {renderScoreBar(stat.wins, stat.draws, stat.losses, stat.gamesCount)}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[10px] text-zinc-600 font-mono uppercase">
                        No popular opening data
                      </div>
                    )}
                  </div>
                </div>

                {/* Best */}
                <div className="space-y-3.5 border-t border-zinc-900/60 pt-5">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                      Best Openings
                    </span>
                    <span className="text-[8px] text-zinc-650 font-mono">(Highest Win Scores)</span>
                  </div>

                  <div className="space-y-3">
                    {repertoireData.best.length > 0 ? (
                      repertoireData.best.map(stat => (
                        <div key={stat.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="rounded bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 font-mono text-[8px] font-extrabold text-neon-green">
                                {stat.eco}
                              </span>
                              <span className="font-sans font-bold text-zinc-200 truncate max-w-[210px]" title={stat.name}>
                                {stat.name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-neon-green font-bold flex-shrink-0">{stat.score}% Score</span>
                          </div>
                          {renderScoreBar(stat.wins, stat.draws, stat.losses, stat.gamesCount)}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[10px] text-zinc-600 font-mono uppercase">
                        No best opening data
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* BLOCK 2: TACTICAL PROFILE */}
            {tacticalProfile && (
              <div className="glow-card rounded-2xl border border-zinc-900 bg-[#0a0d14]/65 p-6 md:p-8 flex flex-col justify-between">
                
                {/* Header */}
                <div className="border-b border-zinc-900 pb-4 mb-6">
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-purple-400">
                    MODULE 03 // PLAYSTYLE ESTIMATION
                  </span>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-purple-400" />
                    TACTICAL PROFILE
                  </h4>
                </div>

                {/* Content Meters */}
                <div className="space-y-5 flex-grow justify-center flex flex-col">
                  {renderTacticalMeter(
                    'Aggression Score',
                    tacticalProfile.aggression,
                    'Determined by low draw rates, high volume of King\'s Pawn openings, and short decisive encounters.',
                    'text-neon-red',
                    'border-glow-red bg-neon-red/10'
                  )}
                  
                  {renderTacticalMeter(
                    'Chaos Index',
                    tacticalProfile.chaos,
                    'Measures structural volatility, short mate/resignation finishes, and sharp unbalanced positions.',
                    'text-purple-400',
                    'border-glow-purple bg-purple-400/10'
                  )}

                  {renderTacticalMeter(
                    'Draw Resistance',
                    tacticalProfile.drawResistance,
                    'Indicates how aggressively the player avoids draw outcomes. High score = zero-sum combat style.',
                    'text-neon-green',
                    'border-glow-green bg-neon-green/10'
                  )}

                  {renderTacticalMeter(
                    'Positional Stability',
                    tacticalProfile.positional,
                    'Reflects preference for closed positions, slow maneuvering lines, and long structural endings.',
                    'text-neon-blue',
                    'border-glow-blue bg-neon-blue/10'
                  )}
                </div>

              </div>
            )}

            {/* BLOCK 3: WEAKNESSES (Worst & Collapse Warnings) */}
            <div className="glow-card rounded-2xl border border-zinc-900 bg-[#0a0d14]/65 p-6 md:p-8 flex flex-col justify-between">
              
              {/* Header & Controls */}
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-6">
                <div>
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-neon-red">
                    MODULE 04 // VULNERABILITY LOGS
                  </span>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Skull className="h-4 w-4 text-neon-red" />
                    WEAKNESS MONITOR
                  </h4>
                </div>
                {renderPerspectiveSelector(weaknessPerspective, setWeaknessPerspective)}
              </div>

              {/* Sub-sections */}
              <div className="space-y-6">
                
                {/* Worst */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                      Worst Openings
                    </span>
                    <span className="text-[8px] text-zinc-650 font-mono">(Lowest Win Rates)</span>
                  </div>

                  <div className="space-y-3">
                    {weaknessesData.worst.length > 0 ? (
                      weaknessesData.worst.map(stat => (
                        <div key={stat.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="rounded bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 font-mono text-[8px] font-extrabold text-neon-red">
                                {stat.eco}
                              </span>
                              <span className="font-sans font-bold text-zinc-200 truncate max-w-[210px]" title={stat.name}>
                                {stat.name}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-neon-red font-semibold flex-shrink-0">{stat.score}% Score</span>
                          </div>
                          {renderScoreBar(stat.wins, stat.draws, stat.losses, stat.gamesCount)}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-[10px] text-zinc-600 font-mono uppercase">
                        No high-failure openings found
                      </div>
                    )}
                  </div>
                </div>

                {/* Collapse warning */}
                <div className="space-y-3.5 border-t border-zinc-900/60 pt-5">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    COLLAPSE WARNING
                  </span>
                  
                  {weaknessesData.collapseWarning ? (
                    <div className="rounded-xl border border-neon-red/25 bg-neon-red/5 p-4 flex gap-3.5 items-start">
                      <AlertTriangle className="h-5 w-5 text-neon-red flex-shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-1 min-w-0">
                        <h6 className="font-mono text-[11px] font-bold text-neon-red uppercase tracking-wider">
                          Late-Game Focus Collapse
                        </h6>
                        <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                          <strong className="text-white font-extrabold">{weaknessesData.collapseWarning.name}</strong> winrate drops sharply after move {weaknessesData.collapseWarning.avgLossMoves}.
                        </p>
                        <p className="text-[9px] font-mono text-zinc-550 leading-relaxed mt-1">
                          The player struggles in conversions or endgames once games stretch out in this structure.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-zinc-900/65 border-dashed p-5 text-center text-[9px] text-zinc-600 font-mono uppercase">
                      No sudden collapse structures detected
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* BLOCK 4: ANTI-REPERTOIRE */}
            <div className="glow-card rounded-2xl border border-zinc-900 bg-[#0a0d14]/65 p-6 md:p-8 flex flex-col justify-between">
              
              {/* Header & Controls */}
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-6">
                <div>
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-neon-green">
                    MODULE 05 // SYSTEM EXCLUSIONS
                  </span>
                  <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-neon-green" />
                    ANTI-REPERTOIRE
                  </h4>
                </div>
                {renderPerspectiveSelector(antiRepertoirePerspective, setAntiRepertoirePerspective)}
              </div>

              {/* Content */}
              <div className="space-y-6">
                
                {/* Fear Openings */}
                <div className="space-y-3.5">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    Fear Openings
                  </span>

                  <div className="space-y-3">
                    {antiRepertoireData.fear.length > 0 ? (
                      antiRepertoireData.fear.map(stat => (
                        <div key={stat.name} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-3.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <span className="rounded bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 font-mono text-[8px] font-extrabold text-neon-red">
                              {stat.eco}
                            </span>
                            <h6 className="font-sans text-xs font-bold text-zinc-300 truncate mt-1.5 max-w-[210px]" title={stat.name}>
                              {stat.name}
                            </h6>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-mono font-extrabold text-neon-red">{stat.score}% Score</div>
                            <div className="text-[8px] font-mono text-zinc-550 uppercase mt-0.5">Struggles Facing System</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-zinc-900/65 border-dashed p-6 text-center text-[9px] text-zinc-600 font-mono uppercase">
                        No clear opening vulnerability triggers
                      </div>
                    )}
                  </div>
                </div>

                {/* Hidden Weapons */}
                <div className="space-y-3.5 border-t border-zinc-900/60 pt-5">
                  <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                    Hidden Weapons
                  </span>

                  <div className="space-y-3">
                    {antiRepertoireData.hidden.length > 0 ? (
                      antiRepertoireData.hidden.map(stat => (
                        <div key={stat.name} className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-3.5 flex items-center justify-between gap-4 group">
                          <div className="min-w-0">
                            <span className="rounded bg-neon-green/10 border border-neon-green/30 px-1.5 py-0.5 font-mono text-[8px] font-extrabold text-neon-green">
                              {stat.eco}
                            </span>
                            <h6 className="font-sans text-xs font-extrabold text-zinc-200 truncate mt-1.5 max-w-[210px]" title={stat.name}>
                              {stat.name}
                            </h6>
                          </div>
                          <div className="text-right flex-shrink-0 font-mono">
                            <div className="text-xs font-black text-neon-green flex items-center justify-end gap-1">
                              <Sparkles className="h-3 w-3 text-neon-green animate-pulse" />
                              <span>{stat.score}% Score</span>
                            </div>
                            <div className="text-[8px] text-zinc-500 uppercase mt-0.5">{stat.gamesCount} Surprise Attacks</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-zinc-900/65 border-dashed p-6 text-center text-[9px] text-zinc-600 font-mono uppercase">
                        No surprise hidden weapons found
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
          
        </div>
      )}
    </div>
  );
}
