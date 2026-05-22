import Dexie, { type Table } from 'dexie';
import { ParsedGame } from '@/types/chess';

export interface DBGame {
  uuid: string;
  username: string; // The player being analyzed
  gameData: ParsedGame;
  endTime: number;
}

export interface DBAnalytics {
  username: string;
  computedAt: number;
  data: any; // Serialized computed analytics
}

class SacThatRookDB extends Dexie {
  games!: Table<DBGame>;
  analytics!: Table<DBAnalytics>;

  constructor() {
    super('SacThatRookDB');
    this.version(1).stores({
      games: 'uuid, username, endTime',
      analytics: 'username, computedAt'
    });
  }
}

export const db = new SacThatRookDB();
