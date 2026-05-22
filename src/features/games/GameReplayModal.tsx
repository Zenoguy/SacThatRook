'use strict';
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ParsedGame } from '@/types/chess';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  ExternalLink 
} from 'lucide-react';

interface GameReplayModalProps {
  game: ParsedGame | null;
  onClose: () => void;
}

export default function GameReplayModal({ game, onClose }: GameReplayModalProps) {
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse moves history using chess.js
  const { moves, fens, headers } = useMemo(() => {
    if (!game) return { moves: [], fens: [], headers: {} };
    
    const chess = new Chess();
    try {
      chess.loadPgn(game.pgn);
      const history = chess.history({ verbose: true });
      
      // Collect FEN positions for each move state
      const positionFens: string[] = [];
      const tempChess = new Chess();
      
      // Initial position
      positionFens.push(tempChess.fen());
      
      for (const m of history) {
        tempChess.move(m.san);
        positionFens.push(tempChess.fen());
      }

      return {
        moves: history.map(m => m.san),
        fens: positionFens,
        headers: chess.header(),
      };
    } catch (err) {
      console.error('Error loading game PGN:', err);
      // Fallback: just return empty state
      return {
        moves: [],
        fens: [new Chess().fen()],
        headers: {},
      };
    }
  }, [game]);

  // Handle keyboard navigation: ArrowLeft (prev), ArrowRight (next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Handle auto play loop
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentMoveIndex((prev) => {
          if (prev >= moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000); // 1 move per second
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, moves]);

  // Reset indices on game change
  useEffect(() => {
    setCurrentMoveIndex(-1);
    setIsPlaying(false);
  }, [game]);

  if (!game) return null;

  const currentFen = currentMoveIndex === -1 ? fens[0] : fens[currentMoveIndex + 1];

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1));
  };

  const handleFirst = () => {
    setIsPlaying(false);
    setCurrentMoveIndex(-1);
  };

  const handleLast = () => {
    setIsPlaying(false);
    setCurrentMoveIndex(moves.length - 1);
  };

  const handleJumpToMove = (idx: number) => {
    setIsPlaying(false);
    setCurrentMoveIndex(idx);
  };

  const handleCopyPgn = async () => {
    try {
      await navigator.clipboard.writeText(game.pgn);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy PGN:', err);
    }
  };

  // Group moves into pairs (White, Black) for display
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
      whiteIdx: i,
      blackIdx: i + 1,
    });
  }

  const whiteResultCode = game.white.result;
  const blackResultCode = game.black.result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fade-in">
      <div className="glow-card rounded-2xl w-full max-w-5xl flex flex-col h-[90vh] md:h-[80vh] overflow-hidden border border-zinc-800 bg-[#07090f]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 px-6 py-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-neon-green">
              {game.timeClass} • {game.dateStr}
            </span>
            <h3 className="font-sans text-sm md:text-base font-extrabold text-white truncate max-w-md md:max-w-xl">
              {game.openingName} ({game.eco})
            </h3>
          </div>
          
          <button 
            onClick={onClose} 
            className="rounded-lg border border-zinc-900 bg-zinc-950 p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Board & Move List Split Area */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Side: Chess Board Container */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-center items-center bg-[#05070a] border-b md:border-b-0 md:border-r border-zinc-900">
            <div className="w-full max-w-[340px] md:max-w-[400px] aspect-square flex items-center justify-center">
              <Chessboard 
                options={{
                  position: currentFen,
                  boardStyle: {
                    borderRadius: '6px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                    border: '5px solid #1e293b',
                    width: '100%',
                    height: '100%'
                  },
                  darkSquareStyle: { backgroundColor: '#1e293b' },
                  lightSquareStyle: { backgroundColor: '#e2e8f0' },
                  allowDragging: false
                }}
              />
            </div>

            {/* Nav Controllers */}
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={handleFirst} 
                disabled={currentMoveIndex === -1}
                className="rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-2 text-zinc-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={handlePrev} 
                disabled={currentMoveIndex === -1}
                className="rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-2 text-zinc-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className="rounded bg-neon-green hover:bg-white text-black p-2.5 transition-all font-bold cursor-pointer"
              >
                {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 fill-black" />}
              </button>
              <button 
                onClick={handleNext} 
                disabled={currentMoveIndex === moves.length - 1}
                className="rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-2 text-zinc-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button 
                onClick={handleLast} 
                disabled={currentMoveIndex === moves.length - 1}
                className="rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-2 text-zinc-400 hover:text-white transition-all disabled:opacity-30 cursor-pointer"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Side: Move list & Match Summary */}
          <div className="w-full md:w-1/2 flex flex-col h-full bg-[#07090f] overflow-hidden">
            
            {/* Match Information Summary */}
            <div className="p-5 border-b border-zinc-900 bg-zinc-950/40 flex flex-col gap-3 font-mono text-[10px]">
              {/* White Player */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-white border border-zinc-700" />
                  <span className="font-bold text-white uppercase tracking-wider">{game.white.username}</span>
                  <span className="text-zinc-500">({game.white.rating})</span>
                </div>
                <span className={`font-bold tracking-widest ${whiteResultCode === 'win' ? 'text-neon-green' : 'text-zinc-500'}`}>
                  {whiteResultCode.toUpperCase()}
                </span>
              </div>

              {/* Black Player */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-zinc-800 border border-zinc-900" />
                  <span className="font-bold text-white uppercase tracking-wider">{game.black.username}</span>
                  <span className="text-zinc-500">({game.black.rating})</span>
                </div>
                <span className={`font-bold tracking-widest ${blackResultCode === 'win' ? 'text-neon-green' : 'text-zinc-500'}`}>
                  {blackResultCode.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Interactive Move Grid List */}
            <div className="flex-grow p-4 overflow-y-auto scrollbar-thin max-h-[30vh] md:max-h-[none]">
              {moves.length === 0 ? (
                <p className="font-mono text-zinc-650 text-center py-10 uppercase tracking-widest text-[10px]">No move sequences parsed</p>
              ) : (
                <div className="grid grid-cols-1 gap-1.5 font-mono text-xs select-none">
                  {movePairs.map((pair) => (
                    <div key={pair.num} className="flex py-1 px-2.5 rounded hover:bg-zinc-900/40 items-center border border-transparent">
                      <span className="text-zinc-600 w-8">{pair.num}.</span>
                      
                      {/* White Move */}
                      <button
                        onClick={() => handleJumpToMove(pair.whiteIdx)}
                        className={`text-left px-3 py-1 rounded w-20 cursor-pointer ${
                          currentMoveIndex === pair.whiteIdx 
                            ? 'bg-neon-green text-black font-extrabold shadow-[0_0_8px_rgba(57,255,20,0.25)]' 
                            : 'text-zinc-300 hover:text-white'
                        }`}
                      >
                        {pair.white}
                      </button>

                      {/* Black Move */}
                      {pair.black && (
                        <button
                          onClick={() => handleJumpToMove(pair.blackIdx)}
                          className={`text-left px-3 py-1 rounded w-20 cursor-pointer ml-4 ${
                            currentMoveIndex === pair.blackIdx 
                              ? 'bg-neon-green text-black font-extrabold shadow-[0_0_8px_rgba(57,255,20,0.25)]' 
                              : 'text-zinc-300 hover:text-white'
                          }`}
                        >
                          {pair.black}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Utility Toolbar footer */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/20 flex items-center justify-between gap-3 font-mono text-[9px] text-zinc-550">
              <button
                onClick={handleCopyPgn}
                className="flex items-center gap-1.5 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 py-1.5 px-3 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-neon-green" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'COPIED PGN' : 'COPY RAW PGN'}</span>
              </button>

              <a
                href={game.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-all"
              >
                <span>VIEW MATCH ON CHESS.COM</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
