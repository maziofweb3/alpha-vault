import type { Signal } from '../execution/risk-manager.js';

/**
 * Momentum indicator trading strategy signal generator.
 */
export function analyzeMomentum(token: string, prices: number[], rsi: number): Signal {
  const currentPrice = prices[prices.length - 1] || 0;
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 50;
  let reasoning = 'Neutral momentum indicators';

  if (rsi > 70) {
    action = 'SELL';
    confidence = 75;
    reasoning = `Overbought RSI: ${rsi.toFixed(1)}, momentum reversal likely.`;
  } else if (rsi < 30) {
    action = 'BUY';
    confidence = 80;
    reasoning = `Oversold RSI: ${rsi.toFixed(1)}, momentum bounce likely.`;
  }

  return {
    token,
    action,
    entry: currentPrice,
    target: action === 'BUY' ? currentPrice * 1.10 : currentPrice * 0.90,
    stopLoss: action === 'BUY' ? currentPrice * 0.95 : currentPrice * 1.05,
    confidence,
    reasoning,
  };
}
