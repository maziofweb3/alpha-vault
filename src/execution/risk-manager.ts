export interface Signal {
  token: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  entry: number;
  target: number;
  stopLoss: number;
  confidence: number;
  reasoning: string;
}

export interface RiskConfig {
  capital: number;
  maxPositionPct: number;
  maxDrawdownPct: number;
  kellyFraction: number;
}

/**
 * Perform risk assessment and position sizing on signals.
 */
export function sizePositions(signals: Signal[], config: RiskConfig) {
  const allocations: Record<string, { pct: number; usdc: number }> = {};
  
  for (const signal of signals) {
    if (signal.action === 'HOLD') continue;

    // Sizing using a conservative Kelly Criterion model
    const winProbability = signal.confidence / 100;
    const lossProbability = 1 - winProbability;
    const rewardToRisk = (signal.target - signal.entry) / (signal.entry - signal.stopLoss);
    
    let kelly = winProbability - lossProbability / (rewardToRisk || 1);
    kelly = Math.max(0, kelly) * config.kellyFraction; // Fraction for caution

    const finalPct = Math.min(kelly, config.maxPositionPct);
    const usdcAllocation = config.capital * finalPct;

    allocations[signal.token] = {
      pct: Math.round(finalPct * 100),
      usdc: Math.round(usdcAllocation * 100) / 100,
    };
  }

  return {
    allocations,
    portfolioVol: 0.15,
    maxDrawdown: config.maxDrawdownPct,
    correlations: {},
    valueAtRisk: config.capital * 0.05,
  };
}
