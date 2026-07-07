import { hashArray } from '../utils/hash.js';

export interface TradeLogEntry {
  timestamp: string;
  action: 'BUY' | 'SELL';
  token: string;
  amount: number;
  price: number;
  fee: number;
  txHash: string;
}

export function computeAccountingHash(trades: TradeLogEntry[]): string {
  return hashArray(trades.map(t => ({
    timestamp: t.timestamp,
    action: t.action,
    token: t.token,
    amount: t.amount,
    price: t.price,
    fee: t.fee,
    txHash: t.txHash
  })), 'timestamp');
}
