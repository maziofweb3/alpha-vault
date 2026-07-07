import Database from 'better-sqlite3';
import type { TradeLogEntry } from './accounting-hash.js';
import { logger } from '../utils/logger.js';

let db: Database.Database | null = null;

function initDb() {
  if (!db) {
    db = new Database('trades.db');
    db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        action TEXT,
        token TEXT,
        amount REAL,
        price REAL,
        fee REAL,
        txHash TEXT
      )
    `);
  }
}

/**
 * Log a trade to local SQLite.
 */
export function logTrade(entry: Omit<TradeLogEntry, 'timestamp'>): TradeLogEntry {
  initDb();
  const timestamp = new Date().toISOString();
  const fullEntry = { ...entry, timestamp };

  try {
    const stmt = db!.prepare(`
      INSERT INTO trades (timestamp, action, token, amount, price, fee, txHash)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      fullEntry.timestamp,
      fullEntry.action,
      fullEntry.token,
      fullEntry.amount,
      fullEntry.price,
      fullEntry.fee,
      fullEntry.txHash
    );
  } catch (err: any) {
    logger.error(`Database log failure: ${err.message}`);
  }

  return fullEntry;
}

/**
 * Retrieve all logged trades.
 */
export function getTradeLogs(): TradeLogEntry[] {
  initDb();
  try {
    const stmt = db!.prepare('SELECT * FROM trades ORDER BY timestamp ASC');
    return stmt.all() as TradeLogEntry[];
  } catch (err: any) {
    logger.error(`Database query failure: ${err.message}`);
    return [];
  }
}
