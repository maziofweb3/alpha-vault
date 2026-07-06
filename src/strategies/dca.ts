import type { Signal } from '../execution/risk-manager.js';

/**
 * Dollar-Cost Averaging strategy signal generator.
 */
export function analyzeDCA(token: string, currentPrice: number): Signal {
  return {
    token,
    action: 'BUY',
    entry: currentPrice,
    target: currentPrice * 1.20,
    stopLoss: currentPrice * 0.80,
    confidence: 100, // DCA always executes buy signal unconditionally
    reasoning: `Scheduled DCA Buy order for ${token}.`,
  };
}
