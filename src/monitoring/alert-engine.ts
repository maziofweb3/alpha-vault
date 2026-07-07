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

  const whale_activity: string[] = [];
  for (const token of tokens) {
    const wTxs = trackWhales(token);
    for (const tx of wTxs) {
      whale_activity.push(
        `Whale transferred ${tx.amount} ${tx.token} ($${(tx.valueUsdc / 1e6).toFixed(2)}M) from ${tx.from} to ${tx.to}`
      );
    }
  }

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
