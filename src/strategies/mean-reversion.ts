import type { Signal } from '../execution/risk-manager.js';

/**
 * Mean Reversion strategy signal generator.
 */
export function analyzeMeanReversion(
  token: string,
  prices: number[],
  bands: { upper: number; lower: number; middle: number }
): Signal {
  const currentPrice = prices[prices.length - 1] || 0;
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 50;
  let reasoning = 'Price trading within standard Bollinger Bands channel';

  if (currentPrice >= bands.upper && bands.upper > 0) {
    action = 'SELL';
    confidence = 70;
    reasoning = `Price at or above Upper Bollinger Band (${bands.upper.toFixed(2)}). Reversion to mean expected.`;
  } else if (currentPrice <= bands.lower && bands.lower > 0) {
    action = 'BUY';
    confidence = 75;
    reasoning = `Price at or below Lower Bollinger Band (${bands.lower.toFixed(2)}). Reversion to mean expected.`;
  }

  return {
    token,
    action,
    entry: currentPrice,
    target: bands.middle,
    stopLoss: action === 'BUY' ? currentPrice * 0.96 : currentPrice * 1.04,
    confidence,
    reasoning,
  };
}
