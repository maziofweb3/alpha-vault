export interface Position {
  token: string;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  pnl: number;
}

/**
 * Tracks current active open positions.
 */
export function getActivePositions(
  holdings: Record<string, number>,
  prices: Record<string, number>
): Position[] {
  return Object.entries(holdings).map(([token, amount]) => {
    const entryPrice = prices[token] || 0; // Simplified average entry
    const currentPrice = prices[token] || 0;
    return {
      token,
      entryPrice,
      currentPrice,
      amount,
      pnl: amount * (currentPrice - entryPrice)
    };
  });
}
