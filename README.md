# SacThatRook ♟️⚡

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**SacThatRook** is a premium, client-side chess telemetry and cognitive performance dashboard for Chess.com players. By utilizing high-performance background parsing pipelines and local offline storage, it dissects player habits, opening repertoires, cognitive collapse patterns, and tactical identities—without requiring external servers or database storage.

---

## 🚀 Key Features

### 🧬 Opening DNA & Intelligence
- **Signature Weapon Extraction**: Identifies the player's core opening family, tracking wins, draws, losses, average moves, and score efficiency.
- **Structural Preference Meters**: Classifies structural preferences into **Open Positions** (King's Pawn ECO: B00-B99, C00-C99) and **Closed Positions** (Queen's Pawn, Flank ECO: A00-A99, D00-E99).
- **Tactical Profile Scores**: Computes multi-dimensional playstyle indices:
  - **Aggression Score**: Derived from draw avoidance, open lines, and short decisive finishes.
  - **Chaos Index**: Volatility indicator showing rates of rapid checkmate/resignation games.
  - **Draw Resistance**: Gauges a player's aversion to split points.
  - **Positional Stability**: Highlights comfort in closed, maneuvering, and long-game endgames.
- **Weakness & Collapse warnings**: Pinpoints structures where the player's performance drops after specific move thresholds (e.g. *French Defense winrate collapses after move 24*).
- **Anti-Repertoire Logs**: Exposes **Fear Openings** (underperforming systems when facing opponent choices) and **Hidden Weapons** (rare surprise openings with high success rates).

### 📈 Combat Analytics & Timelines
- **Historical Rating Trends**: Multi-time-control charts (Bullet, Blitz, Rapid) tracking rating trajectories.
- **Combat Distribution**: Interactive win/draw/loss donut charts with detailed termination ratios.
- **Cognitive Volatility & Tilt Monitor**: Detects emotional performance collapse patterns, rage-queuing, and consecutive game loss spirals.
- **Activity Heatmap**: Github-style contribution grid charting chess volume and session frequency over the past year.

### 🎥 Combat Logs & Interactive Playbacks
- **High-Performance Search & Filter Table**: Search games by opponent username, game outcome, or specific time controls.
- **Interactive Chessboard Modal**: Review and replay game lines directly on the dashboard with a full move-by-move log.
- **PNG Card Generators**: Generate shareable Chess Wrapped annual reports and instantly export high-resolution dashboard cards.

---

## ⚙️ Architecture & Pipeline

SacThatRook operates entirely client-side. The database and computation overhead are handled directly on the user's browser, keeping API tokens secure and dashboards instant.

```
       [ Chess.com Public API ]
                  ↓
          [ PGN Archives ]
                  ↓
     [ High-Perf Web Worker Thread ]  ← Parsing & Regex Move Counting
                  ↓
        [ Dexie.js IndexedDB ]       ← Local Cache Database
                  ↓
     [ Derived Metrics Analytics ]    ← Aggression, Chaos, Opening DNA
                  ↓
     [ Glassmorphic UI Dashboard ]   ← React Query & Recharts Engine
```

---

## 🛠️ Technology Stack

* **Framework**: Next.js 16.2 (App Router)
* **Frontend Library**: React 19.2
* **Styling**: Tailwind CSS v4.0 & PostCSS (Glassmorphism & Neon Glow Themes)
* **Data Fetching**: TanStack React Query v5 (For real-time player statistics & profile caching)
* **Local Storage**: Dexie.js (High-speed IndexedDB wrapper for millions of cached game moves)
* **Background Worker**: HTML5 Web Worker (Non-blocking PGN parses)
* **Visuals**: Recharts (Rating progression graphs) & Lucide Icons

---

## 🏁 Getting Started

### Prerequisites

Ensure you have **Node.js 18+** installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Zenoguy/SacThatRook.git
   cd chess
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:3000` to review the application.

### Build and Production Deployment

To create an optimized production build of the client dashboard:

```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```text
├── public/                 # Favicons, logo assets, and static media
├── src/
│   ├── app/                # Next.js App Router pages and metadata
│   ├── components/         # Global shared layouts, headers, and UI components
│   ├── features/           # Feature-based modular code
│   │   ├── analytics/      # Recharts, WinRateDonut, and ActivityHeatmap
│   │   ├── games/          # RecentGamesTable and Interactive Replay Modals
│   │   ├── openings/       # OpeningIntelligence Grid (DNA, Repertoire, Tactical Profile)
│   │   └── player/         # ProfileHeader, RatingCards, and TopPlayers
│   ├── hooks/              # Custom React Hooks (caching, query states, PGN workers)
│   ├── lib/                # Database initializations (Dexie DB) and queries
│   ├── services/           # External API interfaces (Chess.com SDK endpoints)
│   ├── types/              # Unified TypeScript definitions (ParsedGame, WrappedData)
│   ├── utils/              # Heuristic metrics computations & calculators
│   └── workers/            # Multi-threaded Web Workers for PGN parses
├── package.json            # Dependencies and scripts
└── tsconfig.json           # Compiler configurations
```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
