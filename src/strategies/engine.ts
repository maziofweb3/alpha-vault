import { analyzeMomentum } from './momentum.js';
import { analyzeMeanReversion } from './mean-reversion.js';
import { analyzeBreakout } from './breakout.js';
import { analyzeDCA } from './dca.js';
import { scanArbitrage } from './arbitrage.js';
import { getPriceSnapshot } from '../market/price-feed.js';
import { computeRSI, computeBollingerBands } from '../market/technical.js';
import { sizePositions, type Signal } from '../execution/risk-manager.js';

export interface StrategyRequest {
  strategyType: 'momentum' | 'mean-reversion' | 'breakout' | 'dca' | 'arbitrage';
  tokens: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  capitalUsdc?: number;
}

/**
 * Strategy Orchestrator routing to specific algorithms.
 */
export async function executeStrategy(req: StrategyRequest) {
  const prices = await getPriceSnapshot(req.tokens);
  const signals: Signal[] = [];

  for (const token of req.tokens) {
    const currentPrice = prices[token]?.price || 0;
    
    // Create simple mock historical price data for calculations
    const priceHistory = Array.from({ length: 30 }, (_, i) => currentPrice * (1 + (Math.sin(i) * 0.02)));

    let signal: Signal;
    switch (req.strategyType) {
      case 'momentum':
        const rsi = computeRSI(priceHistory);
        signal = analyzeMomentum(token, priceHistory, rsi);
        break;
      case 'mean-reversion':
        const bands = computeBollingerBands(priceHistory);
        signal = analyzeMeanReversion(token, priceHistory, bands);
        break;
      case 'breakout':
        signal = analyzeBreakout(token, priceHistory);
        break;
      case 'dca':
        signal = analyzeDCA(token, currentPrice);
        break;
      case 'arbitrage':
        signal = scanArbitrage(token, currentPrice);
        break;
      default:
        signal = {
          token,
          action: 'HOLD',
          entry: currentPrice,
          target: currentPrice,
          stopLoss: currentPrice,
          confidence: 0,
          reasoning: 'Invalid strategy type',
        };
    }
    signals.push(signal);
  }

  const riskResult = sizePositions(signals, {
    capital: req.capitalUsdc || 1000,
    maxPositionPct: req.riskTolerance === 'aggressive' ? 0.40 : req.riskTolerance === 'moderate' ? 0.25 : 0.15,
    maxDrawdownPct: 0.10,
    kellyFraction: 0.5,
  });

  return {
    signals,
    allocations: riskResult.allocations,
    riskAssessment: {
      portfolioVolatility: riskResult.portfolioVol,
      maxDrawdownEstimate: riskResult.maxDrawdown,
      valueAtRisk: riskResult.valueAtRisk,
    },
  };
}
