import { AgentClient } from '@croo-network/sdk';
import { logger } from '../utils/logger.js';

/**
 * Interface to perform cross-agent queries hiring OmniResearch for trade support.
 */
export async function queryMarketResearch(
  client: AgentClient,
  researchAgentServiceId: string,
  topic: string
): Promise<any> {
  logger.info(`A2A: Hiring research agent service ${researchAgentServiceId} for topic: "${topic}"`);
  
  try {
    const negotiation = await client.negotiateOrder({
      serviceId: researchAgentServiceId,
      requirements: JSON.stringify({
        topic: `DeFi technical analysis: ${topic}`,
        context: 'Algorithmic trading decision support',
        depth: 'shallow'
      })
    });
    
    logger.info(`Negotiation created successfully: ${negotiation.negotiationId}`);
    return negotiation;
  } catch (err: any) {
    logger.error(`A2A research query failed: ${err.message}`);
    throw err;
  }
}
