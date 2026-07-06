import type { Signal } from '../execution/risk-manager.js';

/**
 * Breakout strategy signal generator.
 */
export function analyzeBreakout(token: string, prices: number[]): Signal {
  const currentPrice = prices[prices.length - 1] || 0;
  
  // Basic resistance & support calculation based on recent high/low
  const high = Math.max(...prices.slice(-20));
  const low = Math.min(...prices.slice(-20));
  
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 50;
  let reasoning = 'Price remains in consolidate channel range';

  if (currentPrice >= high * 0.99) {
    action = 'BUY';
    confidence = 65;
    reasoning = `Price approaching breakout resistance level of $${high.toFixed(2)}`;
  } else if (currentPrice <= low * 1.01) {
    action = 'SELL';
    confidence = 65;
    reasoning = `Price approaching breakdown support level of $${low.toFixed(2)}`;
  }

  return {
    token,
    action,
    entry: currentPrice,
    target: action === 'BUY' ? currentPrice * 1.08 : currentPrice * 0.92,
    stopLoss: action === 'BUY' ? currentPrice * 0.97 : currentPrice * 1.03,
    confidence,
    reasoning,
  };
}
