import { scanTokens } from '../market/scanner.js';
import { trackWhales } from './whale-tracker.js';

/**
 * Scans prices and checks thresholds for user-defined monitoring alerts.
 */
export async function checkAlerts(
  tokens: string[],
  thresholds?: Record<string, { upper?: number; lower?: number }>
) {
  const scans = await scanTokens(tokens);
  const alerts_triggered: string[] = [];
  const market_snapshot: Record<string, any> = {};
  let totalSentiment = 0;

  for (const scan of scans) {
    market_snapshot[scan.symbol] = {
      price: scan.price,
      change24h: scan.change24h,
      volume24h: scan.volume24h,
      sentiment: scan.sentiment,
    };
    totalSentiment += scan.sentiment;

    const limits = thresholds?.[scan.symbol];
    if (limits) {
      if (limits.upper && scan.price >= limits.upper) {
        alerts_triggered.push(`${scan.symbol} price ($${scan.price}) exceeded upper limit $${limits.upper}`);
      }
      if (limits.lower && scan.price <= limits.lower) {
        alerts_triggered.push(`${scan.symbol} price ($${scan.price}) dropped below lower limit $${limits.lower}`);
      }
    }
  }

  const sentiment_score = scans.length > 0 ? totalSentiment / scans.length : 0;

  const rawTransactions = [];
  for (const token of tokens) {
    const wTxs = trackWhales(token);
    rawTransactions.push(...wTxs);
  }

  const whale_activity = {
    total_large_transactions: rawTransactions.length,
    transactions: rawTransactions,
  };

  const recommendation = sentiment_score > 20
    ? 'Bullish sentiment. Potential buying opportunity.'
    : sentiment_score < -20
    ? 'Bearish sentiment. Consider risk mitigation or hedging.'
    : 'Neutral market conditions.';

  return {
    market_snapshot,
    alerts_triggered,
    whale_activity,
    sentiment_score,
    recommendation,
  };
}
