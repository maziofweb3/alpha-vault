import { scanTokens } from '../market/scanner.js';

/**
 * Scans prices and checks thresholds for user-defined monitoring alerts.
 */
export async function checkAlerts(tokens: string[], thresholds?: Record<string, { upper?: number; lower?: number }>) {
  const scans = await scanTokens(tokens);
  const alertsTriggered: string[] = [];

  for (const scan of scans) {
    const limits = thresholds?.[scan.symbol];
    if (limits) {
      if (limits.upper && scan.price >= limits.upper) {
        alertsTriggered.push(`${scan.symbol} price ($${scan.price}) exceeded upper limit $${limits.upper}`);
      }
      if (limits.lower && scan.price <= limits.lower) {
        alertsTriggered.push(`${scan.symbol} price ($${scan.price}) dropped below lower limit $${limits.lower}`);
      }
    }
  }

  return {
    marketSnapshot: scans,
    alertsTriggered,
  };
}
