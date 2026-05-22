import { ChessComGame, ParsedGame, OpeningStat, StreakData, WrappedData } from '../types/chess';

// Helper to clean usernames
function cleanUsername(u: string): string {
  return u.trim().toLowerCase();
}

// Regex-based high-performance PGN header parser
function parsePgnHeaders(pgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerRegex = /\[([A-Za-z0-9_]+)\s+"([^"]*)"\]/g;
  let match;
  while ((match = headerRegex.exec(pgn)) !== null) {
    headers[match[1]] = match[2];
  }
  return headers;
}

// Move counter from PGN moves string
function countMoves(pgn: string): number {
  try {
    const movesPart = pgn.replace(/\[.*?\]/g, '').trim();
    const cleanMoves = movesPart.replace(/\{[\s\S]*?\}/g, '').trim();
    const onlyMoves = cleanMoves.replace(/\d+\.+/g, '').trim();
    const noOutcome = onlyMoves.replace(/(1-0|0-1|1\/2-1\/2|\*)/g, '').trim();
    const tokens = noOutcome.split(/\s+/).filter(t => t.length > 0);
    return Math.ceil(tokens.length / 2);
  } catch {
    return 0;
  }
}

// Map Chess.com result codes to standard outcome: W (win), D (draw), L (loss)
function mapResult(res: string): 'W' | 'L' | 'D' {
  if (res === 'win') return 'W';
  if ([
    'agreed',
    'stalemate',
    'repetition',
    'insufficient',
    '50move',
    'time-vs-insufficient'
  ].includes(res)) {
    return 'D';
  }
  return 'L';
}

// Process a single ChessComGame into our clean ParsedGame interface
function processGame(game: ChessComGame, targetUser: string): ParsedGame {
  const cleanTarget = cleanUsername(targetUser);
  const isWhite = cleanUsername(game.white.username) === cleanTarget;
  
  const player = isWhite ? game.white : game.black;
  const opponent = isWhite ? game.black : game.white;
  
  const headers = parsePgnHeaders(game.pgn);
  
  const eco = headers['ECO'] || 'Unknown';
  let openingName = headers['Opening'] || 'Unknown Opening';
  
  if (openingName === 'Unknown Opening' && headers['ECOUrl']) {
    const urlParts = headers['ECOUrl'].split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart) {
      openingName = lastPart.replace(/-/g, ' ');
    }
  }

  const dateStr = headers['Date'] ? headers['Date'].replace(/\./g, '-') : new Date(game.end_time * 1000).toISOString().split('T')[0];

  const accuracy = game.accuracies 
    ? (isWhite ? game.accuracies.white : game.accuracies.black) 
    : undefined;

  return {
    uuid: game.uuid,
    url: game.url,
    pgn: game.pgn,
    white: {
      username: game.white.username,
      rating: game.white.rating,
      result: game.white.result,
    },
    black: {
      username: game.black.username,
      rating: game.black.rating,
      result: game.black.result,
    },
    playerColor: isWhite ? 'white' : 'black',
    opponent: {
      username: opponent.username,
      rating: opponent.rating,
      result: opponent.result,
    },
    playerRating: player.rating,
    opponentRating: opponent.rating,
    result: mapResult(player.result),
    termination: player.result,
    timeClass: game.time_class,
    timeControl: game.time_control,
    endTime: game.end_time,
    dateStr,
    movesCount: countMoves(game.pgn),
    eco,
    openingName,
    accuracy,
  };
}

// ----------------------------------------------------
// Analytics Helpers (moved into background worker thread)
// ----------------------------------------------------

function computeOpeningStats(games: ParsedGame[]): OpeningStat[] {
  const openingsMap: Record<string, {
    eco: string;
    name: string;
    color: 'white' | 'black';
    gamesCount: number;
    wins: number;
    losses: number;
    draws: number;
    totalOpponentRating: number;
  }> = {};

  for (const game of games) {
    const key = `${game.eco}-${game.playerColor}`;
    if (!openingsMap[key]) {
      openingsMap[key] = {
        eco: game.eco,
        name: game.openingName,
        color: game.playerColor,
        gamesCount: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalOpponentRating: 0,
      };
    }
    const stat = openingsMap[key];
    stat.gamesCount += 1;
    stat.totalOpponentRating += game.opponentRating;
    
    if (game.result === 'W') stat.wins += 1;
    else if (game.result === 'L') stat.losses += 1;
    else stat.draws += 1;
  }

  return Object.values(openingsMap)
    .map(o => ({
      eco: o.eco,
      name: o.name,
      color: o.color,
      gamesCount: o.gamesCount,
      wins: o.wins,
      losses: o.losses,
      draws: o.draws,
      winRate: o.gamesCount > 0 ? parseFloat(((o.wins / o.gamesCount) * 100).toFixed(1)) : 0,
      avgOpponentRating: o.gamesCount > 0 ? Math.round(o.totalOpponentRating / o.gamesCount) : 0
    }))
    .sort((a, b) => b.gamesCount - a.gamesCount);
}

function computeFamilyStats(gamesList: ParsedGame[]) {
  const families: Record<string, {
    name: string;
    ecos: Record<string, number>;
    gamesCount: number;
    wins: number;
    losses: number;
    draws: number;
    totalMovesCount: number;
    whiteGames: number;
    blackGames: number;
  }> = {};

  for (const g of gamesList) {
    if (!g.openingName || g.openingName === 'Unknown Opening') continue;
    const name = g.openingName.split(/[:,-]/)[0].trim();
    if (!families[name]) {
      families[name] = {
        name,
        ecos: {},
        gamesCount: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalMovesCount: 0,
        whiteGames: 0,
        blackGames: 0,
      };
    }
    const fam = families[name];
    fam.gamesCount += 1;
    fam.ecos[g.eco] = (fam.ecos[g.eco] || 0) + 1;
    fam.totalMovesCount += g.movesCount;
    if (g.playerColor === 'white') fam.whiteGames += 1;
    else fam.blackGames += 1;

    if (g.result === 'W') fam.wins += 1;
    else if (g.result === 'L') fam.losses += 1;
    else fam.draws += 1;
  }

  return Object.values(families).map(f => {
    let bestEco = 'Unknown';
    let maxEcoCount = -1;
    for (const [eco, count] of Object.entries(f.ecos)) {
      if (count > maxEcoCount) {
        maxEcoCount = count;
        bestEco = eco;
      }
    }
    const score = f.gamesCount > 0 ? ((f.wins + 0.5 * f.draws) / f.gamesCount) * 100 : 0;
    const winRate = f.gamesCount > 0 ? (f.wins / f.gamesCount) * 100 : 0;
    const avgMoves = f.gamesCount > 0 ? Math.round(f.totalMovesCount / f.gamesCount) : 0;
    return {
      name: f.name,
      eco: bestEco,
      gamesCount: f.gamesCount,
      wins: f.wins,
      losses: f.losses,
      draws: f.draws,
      score: parseFloat(score.toFixed(1)),
      winRate: parseFloat(winRate.toFixed(1)),
      avgMoves,
      whiteGames: f.whiteGames,
      blackGames: f.blackGames,
    };
  }).sort((a, b) => b.gamesCount - a.gamesCount);
}

function computeStreaks(games: ParsedGame[]): StreakData {
  const sorted = [...games].sort((a, b) => a.endTime - b.endTime);
  
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  for (const game of sorted) {
    if (game.result === 'W') {
      currentWinStreak += 1;
      currentLossStreak = 0;
      if (currentWinStreak > longestWinStreak) {
        longestWinStreak = currentWinStreak;
      }
    } else if (game.result === 'L') {
      currentLossStreak += 1;
      currentWinStreak = 0;
      if (currentLossStreak > longestLossStreak) {
        longestLossStreak = currentLossStreak;
      }
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  }

  return {
    longestWinStreak,
    longestLossStreak,
    currentWinStreak,
    currentLossStreak,
  };
}

function computeRatingHistory(games: ParsedGame[], timeClass: 'blitz' | 'rapid' | 'bullet') {
  return games
    .filter(g => g.timeClass === timeClass)
    .sort((a, b) => a.endTime - b.endTime)
    .map(g => ({
      date: g.dateStr,
      rating: g.playerRating,
      opponentRating: g.opponentRating,
      result: g.result,
      opponent: g.opponent.username
    }));
}

function computeWrappedData(games: ParsedGame[], username: string): WrappedData {
  const totalGames = games.length;
  
  const timeClassBreakdown = {
    bullet: 0,
    blitz: 0,
    rapid: 0,
    daily: 0,
  };

  let wins = 0;
  let losses = 0;
  let draws = 0;
  let totalMovesPlayed = 0;

  const dayOfWeekCount: Record<string, number> = {};
  const hourCount: Record<number, number> = {};
  
  let biggestUpsetGame: ParsedGame | null = null;
  let maxUpsetDiff = -Infinity;

  for (const game of games) {
    const tc = game.timeClass;
    if (tc in timeClassBreakdown) {
      timeClassBreakdown[tc as keyof typeof timeClassBreakdown] += 1;
    }

    if (game.result === 'W') wins += 1;
    else if (game.result === 'L') losses += 1;
    else draws += 1;

    totalMovesPlayed += game.movesCount;

    const dateObj = new Date(game.endTime * 1000);
    const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    dayOfWeekCount[dayStr] = (dayOfWeekCount[dayStr] || 0) + 1;

    const hour = dateObj.getHours();
    hourCount[hour] = (hourCount[hour] || 0) + 1;

    if (game.result === 'W' && game.opponentRating > game.playerRating) {
      const diff = game.opponentRating - game.playerRating;
      if (diff > maxUpsetDiff) {
        maxUpsetDiff = diff;
        biggestUpsetGame = game;
      }
    }
  }

  let favoriteTimeClass = 'blitz';
  let maxTcCount = -1;
  Object.entries(timeClassBreakdown).forEach(([k, v]) => {
    if (v > maxTcCount) {
      maxTcCount = v;
      favoriteTimeClass = k;
    }
  });

  const streaks = computeStreaks(games);
  const openings = computeOpeningStats(games);
  
  const mostPlayedOpening = openings.length > 0
    ? {
        name: openings[0].name,
        eco: openings[0].eco,
        count: openings[0].gamesCount,
        winRate: openings[0].winRate
      }
    : null;

  let mostActiveDay: { date: string; count: number } | null = null;
  const activeDaysMap: Record<string, number> = {};
  games.forEach(g => {
    activeDaysMap[g.dateStr] = (activeDaysMap[g.dateStr] || 0) + 1;
  });
  
  let maxDayCount = -1;
  Object.entries(activeDaysMap).forEach(([date, count]) => {
    if (count > maxDayCount) {
      maxDayCount = count;
      mostActiveDay = { date, count };
    }
  });

  let mostActiveHour: { hour: number; count: number } | null = null;
  let maxHourCount = -1;
  Object.entries(hourCount).forEach(([hrStr, count]) => {
    const hr = parseInt(hrStr);
    if (count > maxHourCount) {
      maxHourCount = count;
      mostActiveHour = { hour: hr, count };
    }
  });

  return {
    username,
    totalGames,
    timeClassBreakdown,
    favoriteTimeClass,
    winRate: totalGames > 0 ? parseFloat(((wins / totalGames) * 100).toFixed(1)) : 0,
    wins,
    losses,
    draws,
    mostPlayedOpening,
    biggestUpset: biggestUpsetGame ? {
      opponent: biggestUpsetGame.opponent.username,
      opponentRating: biggestUpsetGame.opponentRating,
      playerRating: biggestUpsetGame.playerRating,
      ratingDiff: maxUpsetDiff,
      date: biggestUpsetGame.dateStr,
      url: biggestUpsetGame.url,
    } : null,
    winStreak: streaks.longestWinStreak,
    tiltStreak: streaks.longestLossStreak,
    mostActiveDay,
    mostActiveHour,
    totalMovesPlayed,
    avgMovesPerGame: totalGames > 0 ? Math.round(totalMovesPlayed / totalGames) : 0,
  };
}

function computeTacticalProfile(gamesList: ParsedGame[]) {
  const total = gamesList.length;
  if (total === 0) return null;

  const draws = gamesList.filter(g => g.result === 'D').length;
  const drawRate = (draws / total) * 100;

  const openGames = gamesList.filter(g => g.eco.startsWith('B') || g.eco.startsWith('C')).length;
  const openPct = (openGames / total) * 100;

  const shortDecisive = gamesList.filter(g => g.movesCount <= 22 && g.result !== 'D').length;
  const shortDecisiveRate = (shortDecisive / total) * 100;

  const longGames = gamesList.filter(g => g.movesCount >= 35).length;
  const longGamesRate = (longGames / total) * 100;

  const drawResistance = Math.round(100 - drawRate);
  const aggression = Math.min(99, Math.max(12, Math.round(
    (100 - drawRate) * 0.4 + openPct * 0.3 + shortDecisiveRate * 2.5
  )));
  const chaos = Math.min(99, Math.max(10, Math.round(
    shortDecisiveRate * 3.5 + (100 - drawRate) * 0.25 + (openPct > 55 ? 10 : 0)
  )));
  const positional = Math.min(99, Math.max(10, Math.round(
    (100 - openPct) * 0.4 + longGamesRate * 0.4 + drawRate * 1.5
  )));

  return { aggression, chaos, drawResistance, positional };
}

function computeRepertoireData(gamesList: ParsedGame[], families: any[]) {
  const popular = families.slice(0, 3);
  const minGames = families.length > 5 ? 3 : 1;
  
  const best = [...families]
    .filter(f => f.gamesCount >= minGames)
    .sort((a, b) => b.score - a.score || b.gamesCount - a.gamesCount)
    .slice(0, 3);

  const hidden = families
    .filter(f => f.gamesCount >= 2 && f.gamesCount <= 4 && f.score >= 70)
    .sort((a, b) => b.score - a.score || b.gamesCount - a.gamesCount)
    .slice(0, 2);

  const fear = families
    .filter(f => f.gamesCount >= 2 && f.score < 40)
    .sort((a, b) => a.score - b.score || b.gamesCount - a.gamesCount)
    .slice(0, 2);

  let dna = null;
  if (gamesList.length > 0 && families.length > 0) {
    const signature = families[0];
    const comfortThreshold = Math.max(2, Math.min(5, Math.round(gamesList.length * 0.04)));
    const comfortOptions = families
      .filter(f => f.gamesCount >= comfortThreshold && f.name !== signature.name)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    const openGames = gamesList.filter(g => g.eco.startsWith('B') || g.eco.startsWith('C')).length;
    const openPct = Math.round((openGames / gamesList.length) * 100);
    const closedPct = 100 - openPct;

    const top3Count = families.slice(0, 3).reduce((sum, f) => sum + f.gamesCount, 0);
    const top3Ratio = Math.round((top3Count / gamesList.length) * 100);

    dna = {
      signature,
      comfortOptions,
      openPct,
      closedPct,
      top3Ratio,
    };
  }

  return { popular, best, hidden, fear, dna };
}

function computeLongitudinal(games: ParsedGame[]) {
  const yearlyGames: Record<number, ParsedGame[]> = {};
  const monthlyGames: Record<string, ParsedGame[]> = {};

  const sorted = [...games].sort((a, b) => a.endTime - b.endTime);

  for (const g of sorted) {
    const dateObj = new Date(g.endTime * 1000);
    const year = dateObj.getUTCFullYear();
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const yyyymm = `${year}-${month}`;

    if (!yearlyGames[year]) yearlyGames[year] = [];
    yearlyGames[year].push(g);

    if (!monthlyGames[yyyymm]) monthlyGames[yyyymm] = [];
    monthlyGames[yyyymm].push(g);
  }

  const yearlyStats: Record<number, any> = {};
  for (const [yearStr, yearGames] of Object.entries(yearlyGames)) {
    const year = parseInt(yearStr, 10);
    const total = yearGames.length;
    const wins = yearGames.filter(g => g.result === 'W').length;
    const draws = yearGames.filter(g => g.result === 'D').length;
    const avgRating = Math.round(yearGames.reduce((sum, g) => sum + g.playerRating, 0) / total);
    const drawRate = parseFloat(((draws / total) * 100).toFixed(1));
    const openCount = yearGames.filter(g => g.eco.startsWith('B') || g.eco.startsWith('C')).length;
    const openPct = Math.round((openCount / total) * 100);

    yearlyStats[year] = {
      gamesCount: total,
      winRate: parseFloat(((wins / total) * 100).toFixed(1)),
      avgRating,
      drawRate,
      openPct,
      closedPct: 100 - openPct
    };
  }

  const insights: any[] = [];
  const years = Object.keys(yearlyGames).map(y => parseInt(y, 10)).sort((a, b) => a - b);

  if (years.length >= 2) {
    for (let i = 1; i < years.length; i++) {
      const prevYear = years[i - 1];
      const currYear = years[i];

      const prevFamilies = computeFamilyStats(yearlyGames[prevYear]);
      const currFamilies = computeFamilyStats(yearlyGames[currYear]);

      if (prevFamilies.length > 0 && currFamilies.length > 0) {
        const topPrev = prevFamilies[0];
        const topCurr = currFamilies[0];

        if (topPrev.name !== topCurr.name && topPrev.gamesCount >= 10) {
          const prevUsageCurr = currFamilies.find(f => f.name === topPrev.name);
          const droppedSignificantly = !prevUsageCurr || (prevUsageCurr.gamesCount / yearlyGames[currYear].length) < (topPrev.gamesCount / yearlyGames[prevYear].length) * 0.5;

          if (droppedSignificantly) {
            insights.push({
              type: 'migration',
              title: `Opening Repertoire Shift (${currYear})`,
              text: `Migrated primary opening choice from ${topPrev.name} (favored in ${prevYear}) to ${topCurr.name} in ${currYear}.`,
              year: currYear
            });
          }
        }
      }
    }

    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    const firstOpen = yearlyStats[firstYear].openPct;
    const lastOpen = yearlyStats[lastYear].openPct;
    if (Math.abs(lastOpen - firstOpen) >= 15) {
      const preferred = lastOpen > firstOpen ? 'sharp open' : 'positional closed';
      insights.push({
        type: 'structure',
        title: 'Structure Shift',
        text: `Career telemetry shows a steady shift toward ${preferred} structures (changing from ${firstOpen}% open in ${firstYear} to ${lastOpen}% open in ${lastYear}).`,
        year: lastYear
      });
    }
  }

  for (const [yyyymm, mGames] of Object.entries(monthlyGames)) {
    const total = mGames.length;
    if (total >= 15) {
      const wins = mGames.filter(g => g.result === 'W').length;
      const winRate = (wins / total) * 100;
      
      let longestLossStreak = 0;
      let currentLossStreak = 0;
      const sortedMGames = [...mGames].sort((a, b) => a.endTime - b.endTime);
      for (const g of sortedMGames) {
        if (g.result === 'L') {
          currentLossStreak++;
          longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
        } else if (g.result === 'W') {
          currentLossStreak = 0;
        }
      }

      if (winRate < 35 && longestLossStreak >= 6) {
        const [year, month] = yyyymm.split('-');
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const monthName = monthNames[parseInt(month, 10) - 1];
        insights.push({
          type: 'tilt',
          title: `Tilt Era Detected (${monthName} ${year})`,
          text: `Experienced a severe performance dip in ${monthName} ${year} with a ${winRate.toFixed(0)}% win rate and a peak ${longestLossStreak}-game losing streak.`,
          year: parseInt(year, 10),
          month: parseInt(month, 10)
        });
      }
    }
  }

  for (const [yyyymm, mGames] of Object.entries(monthlyGames)) {
    const total = mGames.length;
    const bulletGames = mGames.filter(g => g.timeClass === 'bullet');
    if (total >= 80 && bulletGames.length / total > 0.7) {
      const [year, month] = yyyymm.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[parseInt(month, 10) - 1];
      insights.push({
        type: 'addiction',
        title: `Bullet Addiction Phase (${monthName} ${year})`,
        text: `Frenzied blitzing detected: ${bulletGames.length} bullet battles played in ${monthName} ${year} (${Math.round((bulletGames.length / total) * 100)}% of monthly volume).`,
        year: parseInt(year, 10),
        month: parseInt(month, 10)
      });
    }
  }

  const tcs = ['blitz', 'rapid', 'bullet'] as const;
  for (const tc of tcs) {
    const tcGames = sorted.filter(g => g.timeClass === tc);
    if (tcGames.length >= 50) {
      for (let i = 1; i < years.length; i++) {
        const prevYear = years[i - 1];
        const currYear = years[i];
        const prevGames = tcGames.filter(g => new Date(g.endTime * 1000).getUTCFullYear() === prevYear);
        const currGames = tcGames.filter(g => new Date(g.endTime * 1000).getUTCFullYear() === currYear);

        if (prevGames.length >= 10 && currGames.length >= 10) {
          const prevAvg = prevGames.reduce((sum, g) => sum + g.playerRating, 0) / prevGames.length;
          const currAvg = currGames.reduce((sum, g) => sum + g.playerRating, 0) / currGames.length;
          const diff = currAvg - prevAvg;

          if (diff >= 120) {
            insights.push({
              type: 'surge',
              title: `${tc.toUpperCase()} Rating Surge (${currYear})`,
              text: `Experienced explosive growth in ${tc} rating, surging by +${Math.round(diff)} points on average during ${currYear}.`,
              year: currYear
            });
          }
        }
      }
    }
  }

  if (insights.length === 0 && years.length > 0) {
    insights.push({
      type: 'general',
      title: 'Historical Stabilization',
      text: `Analyzed longitudinal telemetry across ${years.length} calendar years (${years[0]} - ${years[years.length - 1]}). Rating trends show steady development and repertoire maturity.`,
      year: years[years.length - 1]
    });
  }

  return { insights, yearlyStats };
}

function classifyPlayerIdentity(games: ParsedGame[], tactical: any, streaks: any) {
  const total = games.length;
  if (total < 30) {
    return {
      primary: 'UNCLASSIFIED SUBJECT',
      subtitle: 'Gathering baseline telemetry',
      description: 'Insufficient historical game files loaded. At least 30 parsed battles are required to construct a reliable behavioral identity dossier.',
      traits: ['Baseline Pending', 'Unknown Preferences'],
      icon: 'Activity'
    };
  }

  const bulletCount = games.filter(g => g.timeClass === 'bullet').length;
  const blitzCount = games.filter(g => g.timeClass === 'blitz').length;
  const rapidCount = games.filter(g => g.timeClass === 'rapid').length;

  const drawCount = games.filter(g => g.result === 'D').length;
  const drawRate = (drawCount / total) * 100;

  const totalMoves = games.reduce((sum, g) => sum + g.movesCount, 0);
  const avgMoves = totalMoves / total;

  const { aggression = 50, chaos = 50, positional = 50 } = tactical || {};

  if (bulletCount / total > 0.65 && chaos > 60) {
    return {
      primary: 'BLITZ CHAOS OPERATIVE',
      subtitle: 'High-speed hyper-volatile disruptor',
      description: `Based on ${total} games of historical telemetry, you are a devotee of raw speed and tactical pandemonium. You avoid draws, prefer open structural setups, and thrive on creating volatile tactical messes that choke opponents on the clock.`,
      traits: ['Clock Pressurer', 'Draw Avoider', 'Tactical Volatility'],
      icon: 'Zap'
    };
  }

  if (positional > 65 && drawRate > 12) {
    return {
      primary: 'POSITIONAL SURVIVALIST',
      subtitle: 'Fortress defensive strategist',
      description: `Your career dossier reveals a highly structured, risk-averse profile. You prefer closed Indian or French setups, lock the center files, accumulate microscopic structural advantages, and grind opponents down in error-free endgames.`,
      traits: ['Prophylaxis Master', 'Endgame Specialist', 'High Draw Tolerance'],
      icon: 'Shield'
    };
  }

  if (aggression > 65 && chaos > 55) {
    return {
      primary: 'TACTICAL COUNTERATTACKER',
      subtitle: 'Aggressive opening sharp-shooter',
      description: `You play chess with maximum kinetic velocity. You choose double-edged openings, push files early, and trigger tactical combinations. Your games feature high checkmate/resignation frequencies and low average moves.`,
      traits: ['King Hunter', 'Opening Sharp-shooter', 'Sharp Repertoire'],
      icon: 'Swords'
    };
  }

  if (avgMoves > 38 && rapidCount / total > 0.4) {
    return {
      primary: 'LONG-FORM STRATEGIST',
      subtitle: 'Deep-calculation logical architect',
      description: `You excel when time permits complete calculation. Telemetry shows a high preference for rapid/daily games, lengthy maneuver phases, and stable ratings growth, showing structured positional understanding and calculation stamina.`,
      traits: ['Deep Calculator', 'Patience-First', 'Rating Stability'],
      icon: 'Brain'
    };
  }

  if (streaks.longestLossStreak >= 8 && chaos > 55) {
    return {
      primary: 'HYPER-VOLATILE ENGAGER',
      subtitle: 'Streak-driven emotional competitor',
      description: `Your history exhibits massive behavioral swings. You are prone to devastating tilt streaks but equally capable of long, unstoppable winning runs. You play emotionally, ignoring draw options in search of immediate decisions.`,
      traits: ['High Volatility', 'Tilt Susceptible', 'Streak Runner'],
      icon: 'Flame'
    };
  }

  return {
    primary: 'VERSATILE STRATEGIST',
    subtitle: 'Dynamic adaptive competitor',
    description: `You maintain a highly flexible chess profile. Telemetry shows you adapt your tactics dynamically based on the color you play and the opponent's rating, shifting seamlessly between aggressive open games and technical endgame grinds.`,
    traits: ['Adaptive Style', 'Balanced Repertoire', 'Tactical Competency'],
    icon: 'Activity'
  };
}

function computeConfidence(games: ParsedGame[]) {
  const count = games.length;
  if (count === 0) {
    return {
      tier: 'LOW',
      gamesAnalyzed: 0,
      yearsCount: 0,
      coverageStr: 'No games processed'
    };
  }

  const times = games.map(g => g.endTime).filter(t => !isNaN(t) && t > 0);
  let coverageStr = '1 month of telemetry';
  let yearsCount = 0;
  if (times.length > 0) {
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const diffMs = (maxTime - minTime) * 1000;
    const diffYears = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    yearsCount = parseFloat(diffYears.toFixed(1));
    
    if (diffYears >= 1) {
      coverageStr = `${diffYears.toFixed(1)} years of telemetry processed`;
    } else {
      const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4));
      coverageStr = `${Math.max(1, diffMonths)} months of telemetry processed`;
    }
  }

  let tier: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (count >= 500 && yearsCount >= 1.5) {
    tier = 'HIGH';
  } else if (count >= 100) {
    tier = 'MEDIUM';
  }

  return {
    tier,
    gamesAnalyzed: count,
    yearsCount,
    coverageStr
  };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Worker message listener
self.onmessage = async function (e: MessageEvent) {
  const { type, games, username } = e.data;

  if (type === 'PARSE_CHUNKS') {
    try {
      const parsedList: ParsedGame[] = [];
      const batchSize = 100;
      const total = games.length;

      if (total === 0) {
        self.postMessage({
          type: 'COMPLETE',
          parsedGames: []
        });
        return;
      }

      for (let i = 0; i < total; i++) {
        parsedList.push(processGame(games[i], username));

        // Report incremental progress every batchSize games
        if ((i + 1) % batchSize === 0 || i === total - 1) {
          const progress = Math.min(100, Math.round(((i + 1) / total) * 100));
          self.postMessage({
            type: 'PROGRESS',
            progress,
            chunk: parsedList.slice(i - (i % batchSize), i + 1),
            isDone: i === total - 1
          });
        }
      }

      self.postMessage({
        type: 'COMPLETE',
        parsedGames: parsedList
      });
    } catch (err: any) {
      self.postMessage({
        type: 'ERROR',
        error: err.message || 'Worker processing error'
      });
    }
  }

  if (type === 'COMPUTE_ANALYTICS') {
    try {
      // Step 1: Opening stats & DNA
      self.postMessage({ type: 'STAGE', stage: 'PROCESSING OPENING DNA', progress: 20 });
      await delay(150);
      
      const openingStats = computeOpeningStats(games);
      const families = computeFamilyStats(games);
      const repertoire = computeRepertoireData(games, families);
      
      // Step 2: Combat/tactical profile
      self.postMessage({ type: 'STAGE', stage: 'COMPUTING TILT METRICS', progress: 50 });
      await delay(150);
      
      const streaks = computeStreaks(games);
      const tacticalProfile = computeTacticalProfile(games);
      const wrappedData = computeWrappedData(games, username);
      
      // Step 3: Rating trajectory
      self.postMessage({ type: 'STAGE', stage: 'REPERTOIRE INTELLIGENCE UPDATED', progress: 80 });
      await delay(150);
      
      const ratingHistory = {
        blitz: computeRatingHistory(games, 'blitz'),
        rapid: computeRatingHistory(games, 'rapid'),
        bullet: computeRatingHistory(games, 'bullet')
      };
      
      const longitudinal = computeLongitudinal(games);
      const playerIdentity = classifyPlayerIdentity(games, tacticalProfile, streaks);
      const confidence = computeConfidence(games);

      self.postMessage({
        type: 'ANALYTICS_COMPLETE',
        analytics: {
          openingStats,
          streaks,
          repertoire,
          tacticalProfile,
          wrappedData,
          ratingHistory,
          longitudinal,
          playerIdentity,
          confidence
        }
      });
    } catch (err: any) {
      self.postMessage({
        type: 'ERROR',
        error: err.message || 'Worker analytics error'
      });
    }
  }
};
