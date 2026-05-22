'use strict';
'use client';

import React from 'react';
import { ChessComProfile } from '@/types/chess';
import { Calendar, User, Eye, ExternalLink, Globe } from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  IN: 'India',
  RU: 'Russia',
  UA: 'Ukraine',
  GB: 'United Kingdom',
  CA: 'Canada',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  BR: 'Brazil',
  PL: 'Poland',
  IT: 'Italy',
  NL: 'Netherlands',
  AR: 'Argentina',
  MX: 'Mexico',
  TR: 'Turkey',
  RO: 'Romania',
  AM: 'Armenia',
  CN: 'China',
  AU: 'Australia',
  NO: 'Norway',
  SE: 'Sweden',
  AZ: 'Azerbaijan',
  GE: 'Georgia',
  HU: 'Hungary',
  UZ: 'Uzbekistan',
  VN: 'Vietnam',
  PH: 'Philippines',
  EG: 'Egypt',
  IR: 'Iran',
  KZ: 'Kazakhstan',
  ID: 'Indonesia',
  RS: 'Serbia',
  HR: 'Croatia',
  CZ: 'Czech Republic',
  BE: 'Belgium',
  AT: 'Austria',
  CH: 'Switzerland',
  IL: 'Israel',
  GR: 'Greece',
  PE: 'Peru',
  CO: 'Colombia',
  CL: 'Chile',
  ZA: 'South Africa',
  NZ: 'New Zealand',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  MY: 'Malaysia',
  XX: 'International'
};

interface ProfileHeaderProps {
  profile: ChessComProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const isOnline = profile.status === 'online';
  
  // Format join date
  const joinedDate = new Date(profile.joined * 1000).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Format last online date
  const lastOnline = new Date(profile.last_online * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Extract country code from URL (e.g., "https://api.chess.com/pub/country/US" -> "US")
  const countryCode = profile.country ? profile.country.split('/').pop()?.toUpperCase() : '';

  // Generate flag emoji
  const getFlagEmoji = (code: string) => {
    if (!code || code.length !== 2 || code === 'XX') return '🌐';
    const codePoints = code
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  };

  const flagEmoji = countryCode ? getFlagEmoji(countryCode) : '';
  const countryName = countryCode ? (COUNTRY_NAMES[countryCode] || countryCode) : '';

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 w-full">
      {/* Avatar Container with Glow Ring */}
      <div className="relative">
        <div className={`h-28 w-28 md:h-32 md:w-32 rounded-xl overflow-hidden border-2 bg-[#0c0e15] flex items-center justify-center transition-all duration-500 ${
          isOnline 
            ? 'border-neon-green shadow-[0_0_20px_rgba(57,255,20,0.3)]' 
            : 'border-zinc-800'
        }`}>
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={profile.avatar} 
              alt={profile.username}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="font-mono text-4xl font-extrabold text-zinc-650 uppercase">
              {profile.username.charAt(0)}
            </span>
          )}
        </div>
        
        {/* Status Indicator Badge */}
        <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold tracking-widest uppercase border ${
          isOnline 
            ? 'bg-neon-green/10 text-neon-green border-neon-green/30 animate-pulse' 
            : 'bg-zinc-900 text-zinc-500 border-zinc-800'
        }`}>
          {profile.status}
        </span>
      </div>

      {/* Profile Details */}
      <div className="flex-grow flex flex-col items-center md:items-start text-center md:text-left gap-3 w-full">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
          {profile.title && (
            <span className="rounded bg-neon-red/10 border border-neon-red/35 px-2 py-0.5 font-mono text-xs font-black tracking-widest text-neon-red uppercase">
              {profile.title}
            </span>
          )}
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            {profile.username}
          </h2>
        </div>

        {profile.name && (
          <p className="text-sm font-sans font-medium text-zinc-400">
            {profile.name}
          </p>
        )}

        {/* Profile Statistics Grid */}
        <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 font-mono text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-neon-green" />
            <span>Joined: <strong className="text-zinc-300">{joinedDate}</strong></span>
          </div>
          <div className="hidden md:block text-zinc-800">•</div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4 text-neon-blue" />
            <span>Online: <strong className="text-zinc-300">{lastOnline}</strong></span>
          </div>
          <div className="hidden md:block text-zinc-800">•</div>
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-zinc-400" />
            <span>Followers: <strong className="text-zinc-300">{profile.followers.toLocaleString()}</strong></span>
          </div>
          {countryName && (
            <>
              <div className="hidden md:block text-zinc-800">•</div>
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-purple-400" />
                <span>Nation: <strong className="text-zinc-300">{flagEmoji} {countryName}</strong></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Call to Actions */}
      <div className="flex flex-shrink-0 flex-col gap-2.5 w-full md:w-auto mt-4 md:mt-0">
        <a
          href={profile.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[#0f121d] px-5 py-3 font-mono text-xs font-bold text-zinc-300 hover:border-neon-green hover:text-white transition-all cursor-pointer"
        >
          <span>CHESS.COM PROFILE</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
