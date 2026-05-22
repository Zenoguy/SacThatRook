'use strict';
'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Zap, Timer, Rocket, Sun, Trophy, ArrowRight } from 'lucide-react';

interface LeaderboardPlayer {
  player_id?: number;
  username: string;
  score: number;
  rank?: number;
  title?: string;
  name?: string;
  avatar?: string;
  win_count?: number;
  loss_count?: number;
  draw_count?: number;
}

interface LeaderboardData {
  live_bullet: LeaderboardPlayer[];
  live_blitz: LeaderboardPlayer[];
  live_rapid: LeaderboardPlayer[];
  daily: LeaderboardPlayer[];
}

const FALLBACK_DATA: LeaderboardData = {
  live_bullet: [
    { username: 'danielnaroditsky', score: 3315, title: 'GM', name: 'Daniel Naroditsky', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/14352140.23f5b7aa.200x200o.854f9d023b8f.png' },
    { username: 'hikaru', score: 3302, title: 'GM', name: 'Hikaru Nakamura', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/15448422.88c010c1.200x200o.3c5619f5441e.png' },
    { username: 'nihalsarin', score: 3280, title: 'GM', name: 'Nihal Sarin', avatar: '' }
  ],
  live_blitz: [
    { username: 'hikaru', score: 3455, title: 'GM', name: 'Hikaru Nakamura', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/15448422.88c010c1.200x200o.3c5619f5441e.png' },
    { username: 'magnuscarlsen', score: 3385, title: 'GM', name: 'Magnus Carlsen', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/3889224.2d499cc8.200x200o.df657f0d0ba5.jpeg' },
    { username: 'nihalsarin', score: 3290, title: 'GM', name: 'Nihal Sarin', avatar: '' }
  ],
  live_rapid: [
    { username: 'magnuscarlsen', score: 2882, title: 'GM', name: 'Magnus Carlsen', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/3889224.2d499cc8.200x200o.df657f0d0ba5.jpeg' },
    { username: 'hikaru', score: 2815, title: 'GM', name: 'Hikaru Nakamura', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/15448422.88c010c1.200x200o.3c5619f5441e.png' },
    { username: 'josemartinez', score: 2795, title: 'GM', name: 'Jose Martinez', avatar: '' }
  ],
  daily: [
    { username: 'skilled_assacin_1210', score: 2695, title: 'GM', name: 'Sukuna', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/556925587.99de5cb2.200x200o.3cdefb0c127f.jpg' },
    { username: 'the_evil_ducklings', score: 2533, title: 'FM', name: 'Roger LaFlair', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/1448848.309d598e.200x200o.91897c97c488.jpeg' },
    { username: 'formerprodigy', score: 2530, title: 'GM', name: 'David Navara', avatar: 'https://images.chesscomfiles.com/uploads/v1/user/52897514.99552f3c.200x200o.cb4cdc4e580b.jpg' }
  ]
};

async function fetchLeaderboards(): Promise<LeaderboardData> {
  const res = await fetch('/api/chess/pub/leaderboards');
  if (!res.ok) {
    throw new Error('Failed to fetch live leaderboards');
  }
  return res.json();
}

interface LeaderboardColumnProps {
  title: string;
  icon: React.ComponentType<any>;
  players: LeaderboardPlayer[];
  colorTheme: {
    accentText: string;
    glowClass: string;
    iconColor: string;
  };
}

function LeaderboardColumn({ title, icon: Icon, players, colorTheme }: LeaderboardColumnProps) {
  // Only display top 3 players
  const topThree = players.slice(0, 3);

  const getRankBadgeStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-400/10 text-amber-400 border border-amber-400/30';
      case 2:
        return 'bg-slate-400/10 text-slate-300 border border-slate-400/30';
      case 3:
        return 'bg-amber-700/10 text-amber-500 border border-amber-700/30';
      default:
        return 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <div className={`glow-card ${colorTheme.glowClass} rounded-xl p-5 flex flex-col justify-between h-full bg-[#0f121d]/85`}>
      <div>
        {/* Category Header */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-900 pb-3">
          <Icon className={`h-5 w-5 ${colorTheme.iconColor}`} />
          <h3 className={`font-mono text-sm font-bold uppercase tracking-widest ${colorTheme.accentText}`}>
            {title}
          </h3>
        </div>

        {/* Players List */}
        <div className="space-y-3.5">
          {topThree.map((player, idx) => {
            const rank = idx + 1;
            const displayName = player.name || player.username;

            return (
              <Link
                key={player.username}
                href={`/player/${player.username.toLowerCase()}`}
                className="group/item flex items-center justify-between gap-3 p-2.5 rounded-lg border border-transparent hover:border-zinc-850 hover:bg-zinc-950/40 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Rank Badge */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${getRankBadgeStyles(rank)}`}>
                    {rank}
                  </div>

                  {/* Player Avatar */}
                  <div className="h-9 w-9 rounded-md overflow-hidden border border-zinc-850 bg-zinc-950 flex items-center justify-center flex-shrink-0">
                    {player.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.avatar}
                        alt={player.username}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-mono text-xs font-bold text-zinc-650 uppercase">
                        {player.username.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Player Names */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      {player.title && (
                        <span className="rounded bg-neon-red/10 border border-neon-red/35 px-1 py-0.2 font-mono text-[8px] font-black text-neon-red uppercase flex-shrink-0">
                          {player.title}
                        </span>
                      )}
                      <span className="font-sans font-bold text-xs text-zinc-100 group-hover/item:text-neon-green transition-colors duration-200 truncate">
                        {displayName}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-zinc-500 truncate">@{player.username}</span>
                  </div>
                </div>

                {/* Rating */}
                <div className="w-[52px] text-right flex flex-col items-end flex-shrink-0 gap-0.5">
                  <span className="font-sans font-bold text-xs text-zinc-200 tracking-tight">
                    {player.score}
                  </span>

                  <span className="font-mono text-[7px] text-zinc-600 uppercase tracking-wider">
                    Rating
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* View Category Wrapped link */}
      <div className="border-t border-zinc-900/60 pt-4 mt-6 flex items-center justify-between font-mono text-[9px] text-zinc-500 group-hover:text-neon-green transition-colors duration-300">
        <span>BOARD TELEMETRY ACTIVE</span>
        <span className="text-[11px]">{getRankEmoji(1)}</span>
      </div>
    </div>
  );
}

export default function TopPlayers() {
  const { data, isLoading, error } = useQuery<LeaderboardData>({
    queryKey: ['leaderboards'],
    queryFn: fetchLeaderboards,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    refetchOnWindowFocus: false
  });

  const leaderboards = data || FALLBACK_DATA;

  // Color configurations matching standard app palette
  const themes = {
    bullet: {
      accentText: 'text-neon-red text-glow-red',
      glowClass: 'glow-card-red',
      iconColor: 'text-neon-red'
    },
    blitz: {
      accentText: 'text-neon-green text-glow-green',
      glowClass: 'glow-card',
      iconColor: 'text-neon-green'
    },
    rapid: {
      accentText: 'text-neon-blue text-glow-blue',
      glowClass: 'glow-card-blue',
      iconColor: 'text-neon-blue'
    },
    daily: {
      accentText: 'text-purple-400 text-glow-purple',
      glowClass: 'hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.1),0_4px_30px_rgba(0,0,0,0.5)]',
      iconColor: 'text-purple-400'
    }
  };

  if (isLoading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 mt-20 border-t border-zinc-900 pt-16">
        <div className="text-center mb-10">
          <h2 className="font-mono text-xl md:text-2xl font-bold tracking-widest text-white uppercase flex items-center justify-center gap-2">
            <span className="text-neon-green">//</span> LEADERBOARD
          </h2>
          <div className="h-3 w-48 bg-zinc-800 rounded mx-auto mt-2 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glow-card rounded-xl p-5 h-[270px] border border-zinc-900 bg-[#0f121d] animate-pulse">
              <div className="h-5 w-32 bg-zinc-850 rounded mb-6" />
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-zinc-800" />
                      <div className="h-8 w-8 rounded-md bg-zinc-800" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-16 bg-zinc-800 rounded" />
                        <div className="h-2.5 w-10 bg-zinc-800 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-10 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 mt-20 border-t border-zinc-900 pt-16">
      <div className="text-center mb-10">
        <h2 className="font-mono text-xl md:text-2xl font-bold tracking-widest text-white uppercase flex items-center justify-center gap-2">
          <span className="text-neon-green">//</span> LEADERBOARD
        </h2>
        <p className="text-xs text-zinc-500 font-mono mt-2">
          Select any ranked master to run client-side telemetry sweeps, openings comfort, and upset analytics.
        </p>
      </div>

      {/* Grid of leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LeaderboardColumn
          title="Bullet Leaderboard"
          icon={Rocket}
          players={leaderboards.live_bullet}
          colorTheme={themes.bullet}
        />
        <LeaderboardColumn
          title="Blitz Leaderboard"
          icon={Zap}
          players={leaderboards.live_blitz}
          colorTheme={themes.blitz}
        />
        <LeaderboardColumn
          title="Rapid Leaderboard"
          icon={Timer}
          players={leaderboards.live_rapid}
          colorTheme={themes.rapid}
        />
        <LeaderboardColumn
          title="Daily Leaderboard"
          icon={Sun}
          players={leaderboards.daily}
          colorTheme={themes.daily}
        />
      </div>
    </section>
  );
}
