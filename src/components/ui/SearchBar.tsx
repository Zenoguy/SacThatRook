'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Flame, Clock, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { RecentSearch } from '@/types/chess';
import { cleanUsername } from '@/services/chesscom';

export default function SearchBar() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState<'chesscom' | 'lichess'>('chesscom');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage<RecentSearch[]>('recent_searches', []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = cleanUsername(username);
    if (!clean) {
      setError('Username cannot be empty');
      return;
    }

    setIsLoading(true);

    try {
      if (platform === 'lichess') {
        setError('Lichess support is coming soon! Switch to Chess.com.');
        setIsLoading(false);
        return;
      }

      // Add to recent searches (limit 5, avoid duplicates)
      const newSearch: RecentSearch = {
        username: clean,
        searchedAt: Date.now(),
      };
      
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.username.toLowerCase() !== clean.toLowerCase());
        return [newSearch, ...filtered].slice(0, 5);
      });

      // Navigate to the player dashboard
      router.push(`/player/${clean}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleRecentClick = (user: string) => {
    setUsername(user);
    setError(null);
    setIsLoading(true);
    router.push(`/player/${cleanUsername(user)}`);
  };

  const clearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
  };

  return (
    <div className="w-full max-w-2xl px-4">
      {/* Platform Tabs */}
      <div className="mb-4 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setPlatform('chesscom')}
          className={`relative rounded-full px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
            platform === 'chesscom'
              ? 'bg-neon-green/10 text-neon-green border border-neon-green/30 shadow-[0_0_10px_rgba(57,255,20,0.1)]'
              : 'border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          Chess.com
        </button>
        <button
          type="button"
          onClick={() => setPlatform('lichess')}
          className={`relative rounded-full px-5 py-2 font-mono text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
            platform === 'lichess'
              ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30 shadow-[0_0_10px_rgba(0,229,255,0.1)]'
              : 'border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          Lichess
          <span className="absolute -top-2 -right-2 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[8px] font-sans font-normal text-zinc-400 border border-zinc-700">
            Soon
          </span>
        </button>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="relative group">
        <div className="relative flex items-center overflow-hidden rounded-xl border border-zinc-800 bg-[#0f121d] p-1.5 transition-all duration-300 focus-within:border-neon-green focus-within:shadow-[0_0_20px_rgba(57,255,20,0.15)] group-hover:border-zinc-700 focus-within:group-hover:border-neon-green">
          <div className="pl-3.5 text-zinc-500 group-focus-within:text-neon-green transition-colors">
            <Search className="h-5 w-5" />
          </div>
          
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            placeholder={
              platform === 'chesscom'
                ? "Enter public Chess.com username (e.g. Hikaru)..."
                : "Lichess username..."
            }
            className="w-full bg-transparent px-3 py-3 font-sans text-sm md:text-base text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="flex h-11 items-center justify-center rounded-lg bg-neon-green px-6 font-mono text-sm font-bold text-black transition-all hover:bg-white active:scale-95 disabled:pointer-events-none disabled:bg-zinc-800 disabled:text-zinc-500 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              'ANALYZE'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-neon-red font-mono pl-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mt-6 pl-1 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <Clock className="h-3 w-3 text-neon-green" />
              Recent Targets
            </span>
            <button
              onClick={clearRecent}
              className="font-mono text-[9px] uppercase tracking-wider text-zinc-600 hover:text-neon-red transition-colors cursor-pointer"
            >
              Clear History
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={s.username}
                type="button"
                onClick={() => handleRecentClick(s.username)}
                disabled={isLoading}
                className="flex items-center gap-1 rounded-md border border-zinc-850 bg-[#0f121d] px-3 py-1.5 font-mono text-xs text-zinc-400 hover:border-neon-green hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <span>{s.username}</span>
                <Flame className="h-3 w-3 text-zinc-600 hover:text-neon-green" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
