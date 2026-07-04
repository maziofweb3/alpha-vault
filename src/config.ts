import 'dotenv/config';

export const config = {
  croo: {
    apiUrl: process.env.CROO_API_URL || 'https://api.croo.network',
    wsUrl: process.env.CROO_WS_URL || 'wss://api.croo.network/ws',
    sdkKey: process.env.CROO_SDK_KEY || '',
  },
  services: {
    monitorId: process.env.CROO_MONITOR_SERVICE_ID || '',
    signalsId: process.env.CROO_SIGNALS_SERVICE_ID || '',
    executionId: process.env.CROO_EXECUTION_SERVICE_ID || '',
    healthId: process.env.CROO_HEALTH_SERVICE_ID || '',
  },
  providerFundAddress: process.env.PROVIDER_FUND_ADDRESS || '',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  coingecko: {
    apiKey: process.env.COINGECKO_API_KEY || '',
  },
  baseRpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  alchemy: {
    apiKey: process.env.ALCHEMY_API_KEY || '',
  },
} as const;

export function validateConfig(): void {
  const required = [
    ['CROO_SDK_KEY', config.croo.sdkKey],
  ] as const;

  const missing = required.filter(([, val]) => !val).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}.`);
  }
}
