import { getPriceSnapshot } from './price-feed.js';
import { getSentimentScore } from './sentiment.js';

export interface ScanResult {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  sentiment: number;
}

/**
 * Scan a list of tokens and build basic profile.
 */
export async function scanTokens(tokens: string[]): Promise<ScanResult[]> {
  const snapshots = await getPriceSnapshot(tokens);
  return tokens.map(symbol => {
    const snap = snapshots[symbol] || { price: 0, change24h: 0, volume24h: 0 };
    return {
      symbol,
      price: snap.price,
      change24h: snap.change24h,
      volume24h: snap.volume24h,
      sentiment: getSentimentScore(snap.change24h),
    };
  });
}
