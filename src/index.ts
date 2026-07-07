import { runProvider } from './provider.js';
import { logger } from './utils/logger.js';

logger.info('Starting AlphaVault bootstrap...');

runProvider().catch((err) => {
  logger.error('Fatal crash in bootstrap:', err);
  process.exit(1);
});
