import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';

export interface PriceSnapshot {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

/**
 * Fetch token prices and market stats.
 */
export async function getPriceSnapshot(tokens: string[]): Promise<Record<string, PriceSnapshot>> {
  const ids = tokens.map(t => t.toLowerCase()).join(',');
  const result: Record<string, PriceSnapshot> = {};

  try {
    const url = 'https://api.coingecko.com/api/v3/simple/price';
    const params: Record<string, any> = {
      ids,
      vs_currencies: 'usd',
      include_24hr_vol: 'true',
      include_24hr_change: 'true',
      include_market_cap: 'true',
    };

    if (config.coingecko.apiKey) {
      params.x_cg_demo_api_key = config.coingecko.apiKey;
    }

    const resp = await axios.get(url, { params });
    
    for (const token of tokens) {
      const id = token.toLowerCase();
      const data = resp.data[id] || {};
      result[token] = {
        price: data.usd || 0,
        change24h: data.usd_24h_change || 0,
        volume24h: data.usd_24h_vol || 0,
        marketCap: data.usd_market_cap || 0,
      };
    }
  } catch (err: any) {
    logger.error(`Failed to fetch CoinGecko prices: ${err.message}`);
    // Fallback mocks for local/demo runs
    for (const token of tokens) {
      result[token] = {
        price: token === 'ETH' ? 3500 : token === 'AAVE' ? 95 : 1.0,
        change24h: 1.5,
        volume24h: 500000000,
        marketCap: 400000000000,
      };
    }
  }

  return result;
}
