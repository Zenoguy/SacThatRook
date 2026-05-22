'use strict';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { 
  ArrowLeft, 
  Cpu, 
  Brain, 
  Flame, 
  Skull, 
  Shield, 
  BookOpen, 
  TrendingUp, 
  Compass, 
  Terminal,
  Activity,
  Workflow,
  AlertTriangle
} from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const navItems = [
    { id: 'overview', label: 'Overview & Architecture', icon: Workflow },
    { id: 'opening-dna', label: 'Opening DNA Diagnostics', icon: Brain },
    { id: 'tactical-profile', label: 'Tactical Playstyle Heuristics', icon: Flame },
    { id: 'weaknesses', label: 'Weakness & Collapse logs', icon: Skull },
    { id: 'tilt-monitor', label: 'Tilt & Emotional Monitor', icon: TrendingUp },
  ];

  React.useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06080d] text-[#f3f4f6]">
      {/* Background Scanlines */}
      <div className="fixed inset-0 grid-scanlines opacity-15 pointer-events-none z-0" />

      <Navbar />

      <div className="flex-grow z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to System Dashboard</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="border-b border-zinc-900 pb-6 mb-10">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-neon-green">
            SYSTEM MANUAL // CLASSIFIED INTEL
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-wider text-white font-mono uppercase mt-1">
            TELEMETRY & HEURISTICS SPECIFICATION
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-wide">
            Under the hood: formulas, data derivation, and diagnostic models for SacThatRook
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-3 sticky top-24 space-y-2">
            <div className="rounded-xl border border-zinc-900 bg-[#0a0d14]/75 p-4 space-y-3.5">
              <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest block px-2">
                Table of Contents
              </span>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-mono text-xs uppercase tracking-wider text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neon-green/10 text-neon-green border-l-2 border-neon-green pl-2.5'
                          : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Detailed Documentation Content Panels */}
          <main className="lg:col-span-9 space-y-12">

            {/* SECTION 1: OVERVIEW & ARCHITECTURE */}
            <section id="overview" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Workflow className="h-5 w-5 text-neon-green" />
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  1. Overview & Pipeline Architecture
                </h2>
              </div>
              
              <div className="space-y-4 font-sans text-sm text-zinc-350 leading-relaxed">
                <p>
                  SacThatRook is designed as a zero-overhead, serverless intelligence engine. It fetches public, anonymized game history records directly from the Chess.com REST API, parsing metadata and move patterns in real-time.
                </p>
                <p>
                  Unlike traditional engines that compute raw move evaluation percentages (eval spam), this system analyzes the **human factors** of play: structural preferences, comfort systems, focus preservation, and emotional tilt profiles.
                </p>

                {/* Architecture workflow box */}
                <div className="glow-card rounded-xl p-5 bg-[#0a0d14]/40 border border-zinc-900 font-mono text-[11px] leading-relaxed space-y-3">
                  <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5 text-zinc-400">
                    <Terminal className="h-4 w-4 text-neon-blue" />
                    <span>DATA PARSING PIPELINE DOSSIER</span>
                  </div>
                  <div className="space-y-2 text-zinc-500">
                    <div>
                      <span className="text-neon-blue">STAGE 01</span> // Fetch player game archives via standard public HTTP endpoints.
                    </div>
                    <div>
                      <span className="text-neon-blue">STAGE 02</span> // Spawn background Web Worker threads (`pgnWorker`) to handle heavy regex PGN parsing without UI main-thread freezing.
                    </div>
                    <div>
                      <span className="text-neon-blue">STAGE 03</span> // Cache raw parsing outputs inside locally embedded IndexedDB storage via Dexie.js for instant offline retrieval.
                    </div>
                    <div>
                      <span className="text-neon-blue">STAGE 04</span> // Compile metrics and trigger the derived heuristics engine to evaluate player habits and tactical exposures.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: OPENING DNA */}
            <section id="opening-dna" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Brain className="h-5 w-5 text-neon-blue" />
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  2. Opening DNA Diagnostics
                </h2>
              </div>

              <div className="space-y-4 font-sans text-sm text-zinc-350 leading-relaxed">
                <p>
                  The Opening DNA panel acts as the player's primary chess identity registry, mapping comfort structures and repertoire concentration:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Signature Weapon
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Identified as the player's most frequent opening family (grouped by base name, stripping specific variation sub-lines).
                    </p>
                    <div className="font-mono text-[10px] text-zinc-500 bg-black/40 rounded p-2">
                      Heuristics: Count game volume where name matches regex split. Sort by count desc. Top opening is Signature.
                    </div>
                  </div>

                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Comfort Systems
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Systems where the player experiences maximum success (win/draw score) with a minimum sample size to screen out anomalies.
                    </p>
                    <div className="font-mono text-[10px] text-zinc-500 bg-black/40 rounded p-2">
                      Score Calculation: <br />
                      <code>score = (wins + 0.5 * draws) / total * 100</code>
                    </div>
                  </div>

                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Structural Preference
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Measures preferred structural sharpness based on standard Encyclopedia of Chess Openings (ECO) codes.
                    </p>
                    <div className="font-mono text-[10px] text-zinc-500 bg-black/40 rounded p-2">
                      Open (King's Pawn): ECO B00-B99, C00-C99 <br />
                      Closed (Queen's Pawn, Flank): ECO A00-A99, D00-E99
                    </div>
                  </div>

                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      Repertoire Concentration
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Indicates predictability of play. High percentage concentration implies a specialized, narrow preparation.
                    </p>
                    <div className="font-mono text-[10px] text-zinc-500 bg-black/40 rounded p-2">
                      Formula: <br />
                      <code>diversity = (games in top 3 families) / total * 100</code>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: TACTICAL PROFILE */}
            <section id="tactical-profile" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Flame className="h-5 w-5 text-purple-400" />
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  3. Tactical Playstyle Heuristics
                </h2>
              </div>

              <div className="space-y-4 font-sans text-sm text-zinc-350 leading-relaxed">
                <p>
                  Playstyle profiles are derived mathematically from game length statistics, structural openness, and the frequency of decisive vs. peaceful draw outcomes.
                </p>

                <div className="space-y-4">
                  {/* Aggression */}
                  <div className="border-l-2 border-neon-red pl-4 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-red" />
                      AGGRESSION SCORE
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Calculates the tendency to force sharp, double-edged structures and avoid draw conditions.
                    </p>
                    <p className="font-mono text-[10px] text-zinc-550">
                      Derivation: 40% Draw Avoidance + 30% Open Structures % + 30% Short Decisive Game Rate.
                    </p>
                  </div>

                  {/* Chaos Index */}
                  <div className="border-l-2 border-purple-400 pl-4 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      CHAOS INDEX
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Indicates structural volatility and tactical instability. High scores represent tactical slugfests with short move counts.
                    </p>
                    <p className="font-mono text-[10px] text-zinc-550">
                      Derivation: Derived from frequency of decisive games resolved in less than 22 moves.
                    </p>
                  </div>

                  {/* Draw Resistance */}
                  <div className="border-l-2 border-neon-green pl-4 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
                      DRAW RESISTANCE
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Measures zero-sum preference. A high score means the player prefers fighting to a finish over accepting draw compromises.
                    </p>
                    <p className="font-mono text-[10px] text-zinc-550">
                      Derivation: <code>100 - drawPercentage</code>.
                    </p>
                  </div>

                  {/* Positional Stability */}
                  <div className="border-l-2 border-neon-blue pl-4 space-y-1">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-blue" />
                      POSITIONAL STABILITY
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Reflects comfort in quiet, maneuver-oriented, and slow endgames. High scores are linked to long structural conversion games.
                    </p>
                    <p className="font-mono text-[10px] text-zinc-550">
                      Derivation: 50% Closed Structures % + 40% Long Game Rate (moves &gt;= 35) + 10% Draw Frequency.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: WEAKNESSES */}
            <section id="weaknesses" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Skull className="h-5 w-5 text-neon-red" />
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  4. Weakness & Collapse Telemetry
                </h2>
              </div>

              <div className="space-y-4 font-sans text-sm text-zinc-350 leading-relaxed">
                <p>
                  Vulnerability logging evaluates structural underperformance. The algorithms identify systems where the player experiences a tactical or focus breakdown:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-neon-red" />
                      Late-Game Focus Collapse
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Tracks if a specific opening structure has a disproportionate loss rate once games extend past move 25. Indicates stamina drain or weak endgame conversions in that setup.
                    </p>
                    <div className="font-mono text-[10px] text-zinc-550 bg-black/40 rounded p-2.5">
                      Formula: <br />
                      <code>Collapse Ratio = (losses &gt;= 25 moves) / total games in structure</code>
                    </div>
                  </div>

                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 space-y-2">
                    <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-neon-green" />
                      Hidden Weapons vs. Fear Openings
                    </h4>
                    <p className="text-xs text-zinc-400">
                      **Fear Openings** are opponent systems the player performs poorly against. **Hidden Weapons** are rare lines (2-4 games played) with a success score of &gt;= 70%.
                    </p>
                    <div className="font-mono text-[10px] text-zinc-550 bg-black/40 rounded p-2.5">
                      Filters: <br />
                      Fear: <code>games &gt;= 2 & score &lt; 40%</code> <br />
                      Hidden: <code>2 &lt;= games &lt;= 4 & score &gt;= 70%</code>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: TILT MONITOR */}
            <section id="tilt-monitor" className="scroll-mt-24 space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <TrendingUp className="h-5 w-5 text-neon-green" />
                <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-white">
                  5. Tilt & Emotional Monitor
                </h2>
              </div>

              <div className="space-y-4 font-sans text-sm text-zinc-350 leading-relaxed">
                <p>
                  Psychological performance indicators track consecutive loss volatility and session behaviors to identify emotional state transitions:
                </p>

                <div className="grid grid-cols-1 gap-4">
                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-lg">
                      <h5 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        Rage Queue Detection
                      </h5>
                      <p className="text-xs text-zinc-450">
                        Tracks consecutive blitz/bullet matches launched immediately after losses, representing emotional queuing patterns.
                      </p>
                    </div>
                    <span className="font-mono text-[10px] rounded bg-neon-red/10 border border-neon-red/30 text-neon-red px-2 py-0.5 uppercase flex-shrink-0 text-center">
                      Trigger: Delta &lt; 120s post-loss
                    </span>
                  </div>

                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-lg">
                      <h5 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        Losing Streaks (Tilt Chains)
                      </h5>
                      <p className="text-xs text-zinc-450">
                        Tracks consecutive losses without draws or wins in a single continuous session block.
                      </p>
                    </div>
                    <span className="font-mono text-[10px] rounded bg-zinc-900 border border-zinc-800 text-zinc-350 px-2 py-0.5 uppercase flex-shrink-0 text-center">
                      Monitored Chronologically
                    </span>
                  </div>

                  <div className="glow-card rounded-xl p-5 border border-zinc-900 bg-zinc-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-lg">
                      <h5 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        Time-Based Session Collapse
                      </h5>
                      <p className="text-xs text-zinc-450">
                        Evaluates win/loss drops based on the local hour of the session, pinpointing late-night cognitive drop-offs.
                      </p>
                    </div>
                    <span className="font-mono text-[10px] rounded bg-neon-blue/10 border border-neon-blue/30 text-neon-blue px-2 py-0.5 uppercase flex-shrink-0 text-center">
                      Trigger: Post-Midnight Blitz
                    </span>
                  </div>
                </div>
              </div>
            </section>

          </main>

        </div>

      </div>
    </div>
  );
}
