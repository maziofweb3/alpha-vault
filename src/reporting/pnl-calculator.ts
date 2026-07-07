import type { TradeLogEntry } from './accounting-hash.js';

export interface PnLReport {
  totalInvested: number;
  totalReturned: number;
  realizedPnL: number;
  unrealizedPnL: number;
  fees: number;
  netReturn: number;
}

/**
 * Compute realized & unrealized PnL from trades and current prices.
 */
export function calculatePnL(
  trades: TradeLogEntry[],
  currentPrices: Record<string, number>,
): PnLReport {
  let totalInvested = 0;
  let totalReturned = 0;
  let fees = 0;
  const positions: Record<string, number> = {};

  for (const trade of trades) {
    fees += trade.fee;
    if (trade.action === 'BUY') {
      const cost = trade.amount * trade.price;
      totalInvested += cost;
      positions[trade.token] = (positions[trade.token] || 0) + trade.amount;
    } else {
      const proceeds = trade.amount * trade.price;
      totalReturned += proceeds;
      positions[trade.token] = (positions[trade.token] || 0) - trade.amount;
    }
  }

  // Calculate unrealized P&L for open positions
  let unrealizedPnL = 0;
  for (const [token, amount] of Object.entries(positions)) {
    if (amount > 0) {
      const currentPrice = currentPrices[token] || 0;
      // Estimate average cost basis
      const buys = trades.filter(t => t.token === token && t.action === 'BUY');
      const avgCost = buys.reduce((sum, t) => sum + t.price, 0) / (buys.length || 1);
      unrealizedPnL += amount * (currentPrice - avgCost);
    }
  }

  const realizedPnL = totalReturned - totalInvested;

  return {
    totalInvested,
    totalReturned,
    realizedPnL,
    unrealizedPnL,
    fees,
    netReturn: realizedPnL + unrealizedPnL - fees,
  };
}
