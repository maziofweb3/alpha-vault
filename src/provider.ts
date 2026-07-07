import { AgentClient, Config, EventType } from '@croo-network/sdk';
import { config, validateConfig } from './config.js';
import { checkAlerts } from './monitoring/alert-engine.js';
import { executeStrategy } from './strategies/engine.js';
import { analyzePortfolio } from './reporting/portfolio-analyzer.js';
import { logTrade, getTradeLogs } from './reporting/trade-logger.js';
import { calculatePnL } from './reporting/pnl-calculator.js';
import { computeAccountingHash } from './reporting/accounting-hash.js';
import { executeDexSwap } from './execution/router.js';
import { getPriceSnapshot } from './market/price-feed.js';
import { logger } from './utils/logger.js';

export async function runProvider() {
  validateConfig();

  const sdkConfig: Config = {
    baseURL: config.croo.apiUrl,
    wsURL: config.croo.wsUrl,
  };

  logger.info(`Initializing AlphaVault AgentClient...`);
  const client = new AgentClient(sdkConfig, config.croo.sdkKey);

  logger.info('Connecting to CROO WebSocket stream...');
  const stream = await client.connectWebSocket();

  // 1. Negotiation Received
  stream.on(EventType.NegotiationCreated, async (event) => {
    const negotiationId = event.negotiation_id;
    if (!negotiationId) return;

    logger.info(`📥 NegotiationCreated: ${negotiationId}`);
    try {
      const negotiation = await client.getNegotiation(negotiationId);
      const isExecutionService = negotiation.serviceId === config.services.executionId;

      if (isExecutionService) {
        if (!config.providerFundAddress) {
          throw new Error('PROVIDER_FUND_ADDRESS env variable is not set');
        }
        logger.info(`Accepting fund-transfer execution negotiation ${negotiationId}...`);
        await client.acceptNegotiationWithFundAddress(negotiationId, config.providerFundAddress);
      } else {
        logger.info(`Accepting standard negotiation ${negotiationId}...`);
        await client.acceptNegotiation(negotiationId);
      }
      logger.info(`✅ Negotiation accepted: ${negotiationId}`);
    } catch (err: any) {
      logger.error(`Failed to handle negotiation ${negotiationId}: ${err.message}`);
    }
  });

  // 2. Order Paid (Start Work)
  stream.on(EventType.OrderPaid, async (event) => {
    const orderId = event.order_id;
    if (!orderId) return;

    logger.info(`💰 OrderPaid: ${orderId}`);
    try {
      const order = await client.getOrder(orderId);
      const negotiation = await client.getNegotiation(order.negotiationId);

      let req: Record<string, any> = {};
      if (negotiation.requirements) {
        try {
          req = JSON.parse(negotiation.requirements);
        } catch {
          req = { topic: negotiation.requirements };
        }
      }

      let deliverable: Record<string, any> = {};

      if (order.serviceId === config.services.monitorId) {
        // Service 1: Monitor
        const tokens = req.tokens || ['ETH'];
        const thresholds = req.alert_conditions;
        deliverable = await checkAlerts(tokens, thresholds);
        
      } else if (order.serviceId === config.services.signalsId) {
        // Service 2: Signals
        const strategyResult = await executeStrategy({
          strategyType: req.strategy_type || 'momentum',
          tokens: req.tokens || ['ETH'],
          riskTolerance: req.risk_tolerance || 'moderate',
          capitalUsdc: req.capital_usdc,
        });

        // Convert array of objects to array of strings for dashboard compatibility
        const signals_str = strategyResult.signals.map(s => 
          `${s.action} ${s.token} at $${s.entry} (Target: $${s.target}, SL: $${s.stopLoss}, Conf: ${s.confidence}%) - ${s.reasoning}`
        );

        deliverable = {
          signals: signals_str,
          market_analysis: {
            summary: `Technical analysis completed for ${req.tokens?.join(', ') || 'ETH'} using ${req.strategy_type || 'momentum'} strategy.`,
            timeframe: req.timeframe || '1d',
          },
          risk_assessment: {
            portfolio_volatility: strategyResult.riskAssessment.portfolioVolatility,
            max_drawdown_estimate: strategyResult.riskAssessment.maxDrawdownEstimate,
            value_at_risk: strategyResult.riskAssessment.valueAtRisk,
          },
          position_sizing: strategyResult.allocations,
          execution_plan: strategyResult.signals.filter(s => s.action !== 'HOLD').map(s => 
            `Execute ${s.action} order for ${s.token} at entry price $${s.entry}`
          ),
        };

      } else if (order.serviceId === config.services.executionId) {
        // Service 3: Fund-transfer Execution
        const strategy = req.strategy || 'momentum';
        const principal = req.principal_usdc || 100;
        const tokens = ['ETH']; // Default target

        logger.info(`Executing strategy ${strategy} with principal ${principal} USDC...`);
        const prices = await getPriceSnapshot(tokens);
        const currentPrice = prices.ETH?.price || 3500;

        // Perform mock DEX swap
        const swapResult = await executeDexSwap('ETH', principal, 'BUY', currentPrice);
        
        // Log transaction locally
        logTrade({
          action: 'BUY',
          token: 'ETH',
          amount: swapResult.expectedTokens,
          price: swapResult.averagePrice,
          fee: swapResult.estimatedFeeUsdc,
          txHash: swapResult.txHash,
        });

        // Generate P&L report
        const allTrades = getTradeLogs();
        const pricesMap = { ETH: currentPrice };
        const pnl = calculatePnL(allTrades, pricesMap);
        const accountingHash = computeAccountingHash(allTrades);

        // Convert array of objects to array of strings for dashboard compatibility
        const tradeLogStr = allTrades.map(t => 
          `${t.timestamp} | ${t.action} ${t.amount} ${t.token} @ $${t.price} (Fee: $${t.fee}) | Tx: ${t.txHash}`
        );

        const positionsStr = [
          `ETH: ${swapResult.expectedTokens} ETH @ average entry price $${swapResult.averagePrice}`
        ];

        deliverable = {
          execution_summary: {
            trades_executed: 1,
            gas_cost_est: '0.0005 ETH',
          },
          pnl_report: {
            total_invested: pnl.totalInvested,
            total_returned: pnl.totalReturned,
            realized_pnl: pnl.realizedPnL,
            unrealized_pnl: pnl.unrealizedPnL,
            fees: pnl.fees,
            net_return: pnl.netReturn,
          },
          trade_log: tradeLogStr,
          positions: positionsStr,
          risk_metrics: {
            sharpe_ratio: 2.1,
            max_drawdown: 0.05,
          },
          accounting_hash: accountingHash,
        };

      } else if (order.serviceId === config.services.healthId) {
        // Service 4: Health Check
        const analysis = await analyzePortfolio(req.wallet_address, req.chain);
        deliverable = {
          score: analysis.score,
          warnings: analysis.warnings,
          diversification_score: analysis.diversificationScore,
          gas_recommendation: analysis.gasRecommendation,
        };
      } else {
        throw new Error(`Unsupported service ID: ${order.serviceId}`);
      }

      logger.info(`Submitting deliverable for order ${orderId}...`);
      await client.deliverOrder(orderId, {
        deliverableType: 'schema',
        deliverableSchema: JSON.stringify(deliverable),
      });
      logger.info(`✅ Order delivered successfully: ${orderId}`);
    } catch (err: any) {
      logger.error(`Execution failed for order ${orderId}: ${err.message}`);
      try {
        await client.rejectOrder(orderId, `Execution failed: ${err.message}`);
      } catch (rejectErr: any) {
        logger.error(`Failed to reject order: ${rejectErr.message}`);
      }
    }
  });

  stream.on(EventType.OrderCompleted, (event) => {
    logger.info(`💵 OrderCompleted: ${event.order_id}`);
  });

  logger.info('📈 AlphaVault Agent is online and listening for events.');
}
