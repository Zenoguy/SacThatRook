'use strict';
'use client';

import React from 'react';
import { 
  Compass, 
  Layers, 
  Flame, 
  Zap, 
  TrendingUp, 
  Activity,
  History,
  Calendar
} from 'lucide-react';

interface CareerInsight {
  type: 'migration' | 'structure' | 'tilt' | 'addiction' | 'surge' | 'general';
  title: string;
  text: string;
  year: number;
  month?: number;
}

interface CareerNarrativeProps {
  insights: CareerInsight[];
}

const INSIGHT_ICONS = {
  migration: { icon: Compass, color: 'text-neon-blue border-neon-blue/20 bg-neon-blue/5', glow: 'shadow-[0_0_10px_rgba(0,229,255,0.15)]' },
  structure: { icon: Layers, color: 'text-purple-400 border-purple-400/20 bg-purple-400/5', glow: 'shadow-[0_0_10px_rgba(192,132,252,0.15)]' },
  tilt: { icon: Flame, color: 'text-neon-red border-neon-red/20 bg-neon-red/5', glow: 'shadow-[0_0_10px_rgba(255,59,48,0.15)]' },
  addiction: { icon: Zap, color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5', glow: 'shadow-[0_0_10px_rgba(234,179,8,0.15)]' },
  surge: { icon: TrendingUp, color: 'text-neon-green border-neon-green/20 bg-neon-green/5', glow: 'shadow-[0_0_10px_rgba(57,255,20,0.15)]' },
  general: { icon: Activity, color: 'text-zinc-400 border-zinc-800 bg-zinc-950', glow: '' }
};

export default function CareerNarrative({ insights }: CareerNarrativeProps) {
  // Sort insights chronologically (latest first, or earliest first; let's show latest first for recency, or chronological timeline starting from oldest)
  // Let's sort latest first (since it's a feed) or by year descending, month descending
  const sortedInsights = React.useMemo(() => {
    return [...insights].sort((a, b) => {
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return (b.month || 0) - (a.month || 0);
    });
  }, [insights]);

  if (sortedInsights.length === 0) {
    return null;
  }

  return (
    <div className="glow-card rounded-2xl p-6 md:p-8 flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-5">
        <h4 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <History className="h-4 w-4 text-neon-green" />
          Longitudinal Career Narratives
        </h4>
        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
          Positional evolution & behavioral milestones decoded across full history
        </p>
      </div>

      {/* Timeline List */}
      <div className="relative pl-4 sm:pl-6 border-l border-zinc-900 ml-4 space-y-8 my-2">
        {sortedInsights.map((item, idx) => {
          const config = INSIGHT_ICONS[item.type] || INSIGHT_ICONS.general;
          const Icon = config.icon;
          const formattedDate = item.month 
            ? `${new Date(2000, item.month - 1).toLocaleString('en-US', { month: 'short' })} ${item.year}`
            : `${item.year}`;

          return (
            <div key={idx} className="relative group">
              {/* Timeline Connector Node */}
              <div className={`absolute left-[-29px] sm:left-[-37px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-zinc-900 bg-[#06080d] z-10 transition-transform duration-300 group-hover:scale-110 ${config.color} ${config.glow}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>

              {/* Content Panel */}
              <div className="rounded-xl border border-zinc-900/60 bg-[#0a0d15]/40 p-4 transition-all duration-300 hover:border-zinc-800 hover:bg-[#0c0f1b]/50">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h5 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    {item.title}
                  </h5>
                  <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-zinc-550 uppercase tracking-widest bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
