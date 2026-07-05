/**
 * Mock/derive market sentiment score from price volatility and trends.
 */
export function getSentimentScore(change24h: number): number {
  // Returns sentiment score from -100 to 100
  let score = 0;
  if (change24h > 5) score += 40;
  else if (change24h > 0) score += 15;
  else if (change24h < -5) score -= 40;
  else if (change24h < 0) score -= 15;

  // Add random variance to simulate fear & greed index
  const variance = Math.floor(Math.random() * 20) - 10;
  return Math.max(-100, Math.min(100, score + variance));
}
