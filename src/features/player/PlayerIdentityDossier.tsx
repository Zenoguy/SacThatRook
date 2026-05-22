'use strict';
'use client';

import React from 'react';
import { 
  Zap, 
  Shield, 
  Swords, 
  Brain, 
  Flame, 
  Activity, 
  Terminal,
  ShieldCheck,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface PlayerIdentity {
  primary: string;
  subtitle: string;
  description: string;
  traits: string[];
  icon: string;
}

interface Confidence {
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  gamesAnalyzed: number;
  yearsCount: number;
  coverageStr: string;
}

interface PlayerIdentityDossierProps {
  identity: PlayerIdentity;
  tacticalProfile: {
    aggression: number;
    chaos: number;
    drawResistance: number;
    positional: number;
  } | null;
  confidence: Confidence;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Zap,
  Shield,
  Swords,
  Brain,
  Flame,
  Activity
};

export default function PlayerIdentityDossier({ identity, tacticalProfile, confidence }: PlayerIdentityDossierProps) {
  const IconComponent = ICON_MAP[identity.icon] || Activity;
  const isHighConf = confidence.tier === 'HIGH';
  const isMediumConf = confidence.tier === 'MEDIUM';

  const renderMeter = (label: string, value: number, desc: string, colorClass: string) => {
    return (
      <div className="space-y-1.5 font-mono">
        <div className="flex justify-between items-baseline text-[10px]">
          <span className="font-bold text-zinc-450 uppercase tracking-widest">{label}</span>
          <span className={`text-xs font-black ${colorClass}`}>{value}%</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-950 border border-zinc-900">
          <div 
            className={`h-full ${colorClass} transition-all duration-500`} 
            style={{ width: `${value}%` }} 
          />
        </div>
        <p className="text-[9px] text-zinc-550 leading-normal">{desc}</p>
      </div>
    );
  };

  return (
    <div className="glow-card relative overflow-hidden rounded-2xl p-6 md:p-8 flex flex-col gap-6 md:gap-8 bg-[#0a0d15] border border-zinc-900">
      {/* Background Matrix/Dossier grid lines */}
      <div className="absolute inset-0 grid-scanlines opacity-5 pointer-events-none" />
      <div className="absolute top-0 right-0 h-36 w-36 bg-gradient-to-bl from-neon-green/10 via-transparent to-transparent opacity-50 rounded-bl-full pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-5 z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-green/5 border border-neon-green/20 text-neon-green">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold text-zinc-400 uppercase tracking-widest">
              BEHAVIORAL QUANTUM TELEMETRY
            </h4>
            <h3 className="font-mono text-[9px] text-neon-green font-bold tracking-widest uppercase mt-0.5 animate-pulse">
              // CLASSIFIED SUBJECT PROFILE DOSSIER
            </h3>
          </div>
        </div>

        {/* Top-Secret Dossier Stamp */}
        <div className="rounded border border-neon-red/30 bg-neon-red/5 px-2.5 py-1 text-center font-mono text-[9px] font-black tracking-widest text-neon-red uppercase">
          SUBJECT: DECLASSIFIED
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8 z-10">
        
        {/* Left Side: Badge + Description */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex items-center gap-4">
            {/* Identity Hex/Icon with double ring glow */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 border-2 border-neon-green text-neon-green shadow-[0_0_15px_rgba(57,255,20,0.15)] flex-shrink-0">
              <IconComponent className="h-8 w-8 animate-pulse" />
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase font-sans">
                {identity.primary}
              </h2>
              <p className="font-mono text-xs text-zinc-450 uppercase tracking-wider font-semibold mt-0.5">
                {identity.subtitle}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {identity.description}
            </p>

            {/* Traits list */}
            <div className="flex flex-wrap gap-2 pt-1">
              {identity.traits.map((trait, idx) => (
                <span 
                  key={idx}
                  className="rounded-lg bg-zinc-950 border border-zinc-850 px-2.5 py-1 font-mono text-[9px] text-zinc-300 font-semibold tracking-wider uppercase hover:border-neon-green hover:text-white transition-all cursor-default"
                >
                  #{trait}
                </span>
              ))}
            </div>
          </div>

          {/* Confidence readout */}
          <div className="pt-2">
            <div className="inline-flex flex-wrap items-center gap-2 rounded-lg bg-zinc-950 border border-zinc-900/60 p-2 font-mono text-[9px] text-zinc-400">
              <div className="flex items-center gap-1">
                {isHighConf ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-neon-green" />
                ) : isMediumConf ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-neon-blue" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-neon-red" />
                )}
                <span className={`font-black uppercase ${
                  isHighConf ? 'text-neon-green' : isMediumConf ? 'text-neon-blue' : 'text-neon-red'
                }`}>
                  {confidence.tier} CONFIDENCE
                </span>
              </div>
              <span className="text-zinc-800">|</span>
              <span>{confidence.gamesAnalyzed.toLocaleString()} Games Analyzed</span>
              <span className="text-zinc-800">|</span>
              <span className="text-zinc-300 font-semibold">{confidence.coverageStr}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Micro-stats progress meters */}
        <div className="lg:col-span-2 space-y-5 rounded-xl border border-zinc-900/70 bg-[#07090f]/75 p-5 md:p-6 flex flex-col justify-center">
          <h5 className="font-mono text-[10px] font-bold text-zinc-350 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-1 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-neon-green" />
            BEHAVIORAL VECTOR INDEX
          </h5>
          {tacticalProfile ? (
            <div className="space-y-4">
              {renderMeter(
                'AGGRESSION INDEX', 
                tacticalProfile.aggression, 
                'Tendency to seek open lines, avoid draws, and play short decisive checkmate attempts.', 
                'text-neon-red bg-neon-red'
              )}
              {renderMeter(
                'TACTICAL CHAOS', 
                tacticalProfile.chaos, 
                'Volatility index measuring game length extremes, clock dependency, and wild tactical complications.', 
                'text-neon-green bg-neon-green'
              )}
              {renderMeter(
                'POSITIONAL STABILITY', 
                tacticalProfile.positional, 
                'Tendency to locking central pawn grids, strategic maneuver patience, and high endgame draw rates.', 
                'text-neon-blue bg-neon-blue'
              )}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-650 font-mono italic">No tactical vectors computed.</p>
          )}
        </div>

      </div>
    </div>
  );
}
