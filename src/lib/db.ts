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

export interface DBArchive {
  url: string;
  username: string;
  fetchedAt: number;
}

class SacThatRookDB extends Dexie {
  games!: Table<DBGame>;
  analytics!: Table<DBAnalytics>;
  archives!: Table<DBArchive>;

  constructor() {
    super('SacThatRookDB');
    this.version(1).stores({
      games: 'uuid, username, endTime',
      analytics: 'username, computedAt'
    });
    this.version(2).stores({
      games: 'uuid, username, endTime',
      analytics: 'username, computedAt',
      archives: 'url, username'
    });
  }
}

export const db = new SacThatRookDB();

