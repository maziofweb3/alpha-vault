import { simulateTrade } from './simulator.js';
import { logger } from '../utils/logger.js';

/**
 * DEX trade router routing swap requests.
 */
export async function executeDexSwap(
  token: string,
  amountUsdc: number,
  action: 'BUY' | 'SELL',
  currentPrice: number,
) {
  logger.info(`Routing swap via 1inch/Uniswap: ${action} ${amountUsdc} USDC of ${token}`);
  const sim = simulateTrade(token, amountUsdc, action, currentPrice);
  return sim;
}
