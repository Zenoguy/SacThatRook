export interface ChessComProfile {
  avatar?: string;
  player_id: number;
  id: string;
  url: string;
  name?: string;
  username: string;
  title?: string;
  followers: number;
  country: string;
  joined: number;
  last_online: number;
  status: string;
  is_bypass?: boolean;
}

export interface RatingStats {
  last: {
    rating: number;
    date?: number;
  };
  best: {
    rating: number;
    date?: number;
  };
  record: {
    win: number;
    loss: number;
    draw: number;
    time_per_move?: number;
  };
}

export interface ChessComStats {
  chess_blitz?: RatingStats;
  chess_rapid?: RatingStats;
  chess_bullet?: RatingStats;
  tactics?: {
    highest?: {
      rating: number;
      date: number;
    };
    lowest?: {
      rating: number;
      date: number;
    };
  };
  puzzle_rush?: {
    best?: {
      total_attempts: number;
      score: number;
    };
  };
}

export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  accuracies?: {
    white: number;
    black: number;
  };
  tcn: string;
  uuid: string;
  initial_setup: string;
  fen: string;
  time_class: 'blitz' | 'rapid' | 'bullet' | 'daily';
  rules: string;
  white: {
    rating: number;
    result: string;
    id: string;
    username: string;
    uuid: string;
  };
  black: {
    rating: number;
    result: string;
    id: string;
    username: string;
    uuid: string;
  };
}

export interface ParsedGame {
  uuid: string;
  url: string;
  pgn: string;
  white: {
    username: string;
    rating: number;
    result: string;
  };
  black: {
    username: string;
    rating: number;
    result: string;
  };
  playerColor: 'white' | 'black';
  opponent: {
    username: string;
    rating: number;
    result: string;
  };
  playerRating: number;
  opponentRating: number;
  result: 'W' | 'L' | 'D'; // W = win, L = loss, D = draw
  termination: string; // checkmate, resigned, timeout, agreed, stalemated, etc.
  timeClass: 'blitz' | 'rapid' | 'bullet' | 'daily';
  timeControl: string;
  endTime: number; // Unix timestamp
  dateStr: string; // YYYY-MM-DD
  movesCount: number;
  eco: string;
  openingName: string;
  accuracy?: number; // player accuracy if available
}

export interface OpeningStat {
  eco: string;
  name: string;
  color: 'white' | 'black';
  gamesCount: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number; // Percentage
  avgOpponentRating: number;
}

export interface StreakData {
  longestWinStreak: number;
  longestLossStreak: number; // Tilt streak
  currentWinStreak: number;
  currentLossStreak: number;
}

export interface ActivityPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface WrappedData {
  username: string;
  totalGames: number;
  timeClassBreakdown: {
    bullet: number;
    blitz: number;
    rapid: number;
    daily: number;
  };
  favoriteTimeClass: string;
  winRate: number; // overall W / total games percentage
  wins: number;
  losses: number;
  draws: number;
  mostPlayedOpening: {
    name: string;
    eco: string;
    count: number;
    winRate: number;
  } | null;
  biggestUpset: {
    opponent: string;
    opponentRating: number;
    playerRating: number;
    ratingDiff: number;
    date: string;
    url: string;
  } | null;
  winStreak: number;
  tiltStreak: number;
  mostActiveDay: {
    date: string;
    count: number;
  } | null;
  mostActiveHour: {
    hour: number; // 0 - 23
    count: number;
  } | null;
  totalMovesPlayed: number;
  avgMovesPerGame: number;
}

export interface RecentSearch {
  username: string;
  avatar?: string;
  title?: string;
  searchedAt: number;
}
