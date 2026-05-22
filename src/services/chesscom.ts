import { ChessComProfile, ChessComStats, ChessComGame } from '@/types/chess';

// Standard base for our proxy
const PROXY_BASE = '/api/chess';

/**
 * Standardizes usernames (Chess.com is case-insensitive, but URLs are cleaner in lower case)
 */
export function cleanUsername(username: string): string {
  return username.trim().toLowerCase();
}

/**
 * Fetches player public profile from Chess.com
 */
export async function fetchPlayerProfile(username: string, bypassCache?: boolean): Promise<ChessComProfile> {
  const clean = cleanUsername(username);
  const url = `${PROXY_BASE}/pub/player/${clean}${bypassCache ? '?nocache=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Chess.com player "${username}" not found.`);
    }
    throw new Error(`Failed to fetch profile: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches player statistics (ratings, records)
 */
export async function fetchPlayerStats(username: string, bypassCache?: boolean): Promise<ChessComStats> {
  const clean = cleanUsername(username);
  const url = `${PROXY_BASE}/pub/player/${clean}/stats${bypassCache ? '?nocache=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch player stats: ${res.statusText}`);
  }
  return res.json();
}

/**
 * Fetches the list of monthly game archive URLs for a player
 */
export async function fetchPlayerArchives(username: string, bypassCache?: boolean): Promise<string[]> {
  const clean = cleanUsername(username);
  const url = `${PROXY_BASE}/pub/player/${clean}/games/archives${bypassCache ? '?nocache=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch game archives list: ${res.statusText}`);
  }
  const data = await res.json();
  return data.archives || [];
}

/**
 * Fetches games for a specific month using either an archive URL or a year/month pair.
 * Translates chess.com absolute URLs to use our local proxy to avoid CORS.
 */
export async function fetchMonthlyGames(archiveUrl: string, bypassCache?: boolean): Promise<ChessComGame[]> {
  // Translate "https://api.chess.com/pub/player/..." to "/api/chess/pub/player/..."
  const proxyUrl = archiveUrl.replace('https://api.chess.com/', `${PROXY_BASE}/`);
  const separator = proxyUrl.includes('?') ? '&' : '?';
  const url = `${proxyUrl}${bypassCache ? `${separator}nocache=true` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch games for archive: ${archiveUrl}`);
  }
  const data = await res.json();
  return data.games || [];
}
