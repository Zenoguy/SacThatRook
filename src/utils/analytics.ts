import { ParsedGame, OpeningStat, StreakData, WrappedData } from '../types/chess';

/**
 * Groups and computes win/loss metrics for openings played by the user
 */
export function computeOpeningStats(games: ParsedGame[]): OpeningStat[] {
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
    // Sort by most played
    .sort((a, b) => b.gamesCount - a.gamesCount);
}

/**
 * Calculates current and longest win/loss streaks (tilt streaks) chronologically
 */
export function computeStreaks(games: ParsedGame[]): StreakData {
  // Sort games chronologically (oldest to newest) to walk through the streaks
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
      // Draw breaks both streaks
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

/**
 * Computes a time-series of ratings per time control for rendering rating charts
 */
export function computeRatingHistory(games: ParsedGame[], timeClass: 'blitz' | 'rapid' | 'bullet') {
  // Filter games, sort chronologically
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

/**
 * Generates aggregated data for the full Chess Wrapped experience
 */
export function computeWrappedData(games: ParsedGame[], username: string): WrappedData {
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

  // Day of week / Hour breakdown
  const dayOfWeekCount: Record<string, number> = {};
  const hourCount: Record<number, number> = {};
  
  let biggestUpsetGame: ParsedGame | null = null;
  let maxUpsetDiff = -Infinity;

  for (const game of games) {
    // Increment timeclass count
    const tc = game.timeClass;
    if (tc in timeClassBreakdown) {
      timeClassBreakdown[tc as keyof typeof timeClassBreakdown] += 1;
    }

    // Increment W/D/L
    if (game.result === 'W') wins += 1;
    else if (game.result === 'L') losses += 1;
    else draws += 1;

    totalMovesPlayed += game.movesCount;

    // Day of Week tracking (local time or dateStr)
    const dateObj = new Date(game.endTime * 1000);
    const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    dayOfWeekCount[dayStr] = (dayOfWeekCount[dayStr] || 0) + 1;

    // Hour tracking
    const hour = dateObj.getHours();
    hourCount[hour] = (hourCount[hour] || 0) + 1;

    // Upset tracking: Player won (result === 'W') against higher rated opponent (opponentRating > playerRating)
    if (game.result === 'W' && game.opponentRating > game.playerRating) {
      const diff = game.opponentRating - game.playerRating;
      if (diff > maxUpsetDiff) {
        maxUpsetDiff = diff;
        biggestUpsetGame = game;
      }
    }
  }

  // Favorite Time control
  let favoriteTimeClass = 'blitz';
  let maxTcCount = -1;
  Object.entries(timeClassBreakdown).forEach(([k, v]) => {
    if (v > maxTcCount) {
      maxTcCount = v;
      favoriteTimeClass = k;
    }
  });

  // Streaks
  const streaks = computeStreaks(games);

  // Most Played Opening
  const openings = computeOpeningStats(games);
  const mostPlayedOpening = openings.length > 0
    ? {
        name: openings[0].name,
        eco: openings[0].eco,
        count: openings[0].gamesCount,
        winRate: openings[0].winRate
      }
    : null;

  // Most Active Day
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

  // Most Active Hour
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
