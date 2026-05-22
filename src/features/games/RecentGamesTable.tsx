'use strict';
'use client';

import React, { useState, useMemo } from 'react';
import { ParsedGame } from '@/types/chess';
import GameReplayModal from './GameReplayModal';
import { 
  Play, 
  Filter, 
  HelpCircle, 
  ChevronDown, 
  User, 
  Award,
  Zap,
  Timer,
  Rocket,
  Sun
} from 'lucide-react';

interface RecentGamesTableProps {
  games: ParsedGame[];
}

export default function RecentGamesTable({ games }: RecentGamesTableProps) {
  const [selectedGame, setSelectedGame] = useState<ParsedGame | null>(null);

  // Filters
  const [filterResult, setFilterResult] = useState<'ALL' | 'W' | 'L' | 'D'>('ALL');
  const [filterTimeClass, setFilterTimeClass] = useState<'ALL' | 'blitz' | 'rapid' | 'bullet' | 'daily'>('ALL');
  const [filterColor, setFilterColor] = useState<'ALL' | 'white' | 'black'>('ALL');

  // Filter games based on selection
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchResult = filterResult === 'ALL' || g.result === filterResult;
      const matchTimeClass = filterTimeClass === 'ALL' || g.timeClass === filterTimeClass;
      const matchColor = filterColor === 'ALL' || g.playerColor === filterColor;
      return matchResult && matchTimeClass && matchColor;
    });
  }, [games, filterResult, filterTimeClass, filterColor]);

  // Clean termination strings for visual appeal
  const getFriendlyTermination = (term: string) => {
    switch (term) {
      case 'win': return 'Victory';
      case 'checkmated': return 'Checkmated';
      case 'resigned': return 'Resigned';
      case 'timeout': return 'Timeout';
      case 'abandoned': return 'Abandoned';
      case 'stalemate': return 'Stalemate';
      case 'agreed': return 'Agreed draw';
      case 'repetition': return 'Repetition';
      default: return term;
    }
  };

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <Filter className="h-4 w-4 text-neon-green" />
            Combat Logs
          </h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Filterable history of recent chess matches</p>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto font-mono text-[10px]">
          {/* Time control filter */}
          <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-900 px-2.5 py-1">
            <span className="text-zinc-550 uppercase mr-2 tracking-wider">Format:</span>
            <select
              value={filterTimeClass}
              onChange={(e) => setFilterTimeClass(e.target.value as any)}
              className="bg-transparent text-zinc-300 font-bold focus:outline-none cursor-pointer uppercase"
            >
              <option value="ALL" className="bg-[#0f121d]">All Format</option>
              <option value="blitz" className="bg-[#0f121d]">Blitz</option>
              <option value="rapid" className="bg-[#0f121d]">Rapid</option>
              <option value="bullet" className="bg-[#0f121d]">Bullet</option>
              <option value="daily" className="bg-[#0f121d]">Daily</option>
            </select>
          </div>

          {/* Outcome filter */}
          <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-900 px-2.5 py-1">
            <span className="text-zinc-550 uppercase mr-2 tracking-wider">Outcome:</span>
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value as any)}
              className="bg-transparent text-zinc-300 font-bold focus:outline-none cursor-pointer uppercase"
            >
              <option value="ALL" className="bg-[#0f121d]">All Result</option>
              <option value="W" className="bg-[#0f121d]">Win</option>
              <option value="L" className="bg-[#0f121d]">Loss</option>
              <option value="D" className="bg-[#0f121d]">Draw</option>
            </select>
          </div>

          {/* Color filter */}
          <div className="flex items-center rounded-lg bg-zinc-950 border border-zinc-900 px-2.5 py-1">
            <span className="text-zinc-550 uppercase mr-2 tracking-wider">Color:</span>
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value as any)}
              className="bg-transparent text-zinc-300 font-bold focus:outline-none cursor-pointer uppercase"
            >
              <option value="ALL" className="bg-[#0f121d]">All Colors</option>
              <option value="white" className="bg-[#0f121d]">White</option>
              <option value="black" className="bg-[#0f121d]">Black</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tables Area */}
      <div className="w-full overflow-x-auto select-none rounded-xl border border-zinc-900 bg-zinc-950/20">
        <table className="w-full min-w-[700px] text-left border-collapse font-sans text-xs">
          <thead>
            <tr className="border-b border-zinc-900 bg-zinc-950/40 text-zinc-500 uppercase tracking-widest font-mono text-[9px]">
              <th className="py-4 px-4 font-bold">Time Control</th>
              <th className="py-4 px-4 font-bold">Opponent</th>
              <th className="py-4 px-4 font-bold">Outcome</th>
              <th className="py-4 px-4 font-bold">Accuracy</th>
              <th className="py-4 px-4 font-bold">Opening Sequence</th>
              <th className="py-4 px-4 font-bold text-right">Interactive</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {filteredGames.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center font-mono text-zinc-650 uppercase tracking-wider text-[10px]">
                  No game logs fit the active search parameters
                </td>
              </tr>
            ) : (
              filteredGames.slice(0, 15).map((game) => {
                const isWin = game.result === 'W';
                const isLoss = game.result === 'L';
                const outcomeClass = isWin 
                  ? 'bg-neon-green/10 text-neon-green border-neon-green/30 shadow-[0_0_10px_rgba(57,255,20,0.1)]' 
                  : isLoss 
                  ? 'bg-neon-red/10 text-neon-red border-neon-red/30' 
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/30';
                
                const timeControlIcon = game.timeClass === 'blitz' 
                  ? <Zap className="h-3.5 w-3.5 text-neon-green" /> 
                  : game.timeClass === 'rapid' 
                  ? <Timer className="h-3.5 w-3.5 text-neon-blue" /> 
                  : game.timeClass === 'bullet'
                  ? <Rocket className="h-3.5 w-3.5 text-neon-red" />
                  : <Sun className="h-3.5 w-3.5 text-purple-400" />;

                return (
                  <tr key={game.uuid} className="hover:bg-zinc-900/15 transition-all">
                    {/* Time Class */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-1.5 uppercase font-bold text-[10px]">
                        {timeControlIcon}
                        <span>{game.timeClass} ({game.timeControl})</span>
                      </div>
                    </td>

                    {/* Opponent details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${game.playerColor === 'white' ? 'bg-zinc-800' : 'bg-white'}`} title={game.playerColor === 'white' ? 'Player was White' : 'Player was Black'} />
                        <span className="font-semibold text-white tracking-wide">{game.opponent.username}</span>
                        <span className="font-mono text-[10px] text-zinc-550">({game.opponentRating})</span>
                      </div>
                    </td>

                    {/* Outcome */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className={`inline-flex items-center justify-center rounded px-2 py-0.5 font-mono text-[9px] font-black uppercase border w-11 ${outcomeClass}`}>
                          {game.result}
                        </span>
                        <span className="text-[10px] text-zinc-550 font-mono scale-90 -ml-1 text-left">
                          {getFriendlyTermination(game.termination)}
                        </span>
                      </div>
                    </td>

                    {/* Accuracy */}
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-350">
                      {game.accuracy ? (
                        <span className={game.accuracy >= 80 ? 'text-neon-green' : game.accuracy >= 65 ? 'text-neon-blue' : 'text-zinc-300'}>
                          {game.accuracy.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-zinc-650">--</span>
                      )}
                    </td>

                    {/* Opening */}
                    <td className="py-3.5 px-4 max-w-[200px] truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 font-extrabold">
                          {game.eco}
                        </span>
                        <span className="font-medium text-zinc-300 truncate" title={game.openingName}>
                          {game.openingName}
                        </span>
                      </div>
                    </td>

                    {/* Interactive Board Trigger */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedGame(game)}
                        className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-800 hover:border-neon-green hover:text-white transition-all py-1.5 px-3 font-mono text-[9px] font-bold text-zinc-400 cursor-pointer active:scale-95"
                      >
                        <Play className="h-3 w-3 fill-zinc-400 hover:fill-white text-transparent" />
                        <span>REPLAY</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Replay Modal trigger */}
      {selectedGame && (
        <GameReplayModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
        />
      )}
    </div>
  );
}
