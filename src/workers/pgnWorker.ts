import { ChessComGame, ParsedGame } from '../types/chess';

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
    // Strip headers
    const movesPart = pgn.replace(/\[.*?\]/g, '').trim();
    // Strip comments (curly braces)
    const cleanMoves = movesPart.replace(/\{[\s\S]*?\}/g, '').trim();
    // Strip move numbers (e.g. 1., 2...)
    const onlyMoves = cleanMoves.replace(/\d+\.+/g, '').trim();
    // Strip outcome (1-0, 0-1, etc.)
    const noOutcome = onlyMoves.replace(/(1-0|0-1|1\/2-1\/2|\*)/g, '').trim();
    // Split by whitespace
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
  
  // Extract opening name and ECO
  const eco = headers['ECO'] || 'Unknown';
  let openingName = headers['Opening'] || 'Unknown Opening';
  
  // Clean up opening URL if no name is available
  if (openingName === 'Unknown Opening' && headers['ECOUrl']) {
    const urlParts = headers['ECOUrl'].split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart) {
      openingName = lastPart.replace(/-/g, ' ');
    }
  }

  // End date parsing
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

// Worker message listener
self.onmessage = function (e: MessageEvent) {
  const { type, games, username } = e.data;

  if (type === 'PARSE_CHUNKS') {
    try {
      const parsedList: ParsedGame[] = [];
      const batchSize = 100;
      const total = games.length;

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
};
