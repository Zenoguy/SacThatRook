'use strict';
'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, Activity } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1e293b] bg-[#06080d]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0f121d] p-1.5 transition-all group-hover:border-neon-green group-hover:shadow-[0_0_15px_rgba(57,255,20,0.2)]">
              <img 
                src="/favicon.png" 
                alt="SacThatRook Logo" 
                className="h-full w-full object-contain transition-all duration-300 group-hover:scale-110" 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-lg font-bold tracking-wider text-white sm:text-xl">
                SAC<span className="text-neon-green text-glow-green">THAT</span>ROOK
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 group-hover:text-neon-green/80 transition-colors">
                Tactical Chess Analytics
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <a
            href="https://www.chess.com/news/view/published-data-api"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <Activity className="h-4 w-4 text-neon-blue" />
            <span className="hidden sm:inline">Chess.com API</span>
          </a>
          <Link
            href="/#about"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">FAQ</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
