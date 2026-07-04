type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(msg: string, ...args: unknown[]) {
    if (LOG_LEVELS.debug >= LOG_LEVELS[currentLevel]) console.debug(`[${timestamp()}] 🐛 ${msg}`, ...args);
  },
  info(msg: string, ...args: unknown[]) {
    if (LOG_LEVELS.info >= LOG_LEVELS[currentLevel]) console.log(`[${timestamp()}] ℹ️  ${msg}`, ...args);
  },
  warn(msg: string, ...args: unknown[]) {
    if (LOG_LEVELS.warn >= LOG_LEVELS[currentLevel]) console.warn(`[${timestamp()}] ⚠️  ${msg}`, ...args);
  },
  error(msg: string, ...args: unknown[]) {
    if (LOG_LEVELS.error >= LOG_LEVELS[currentLevel]) console.error(`[${timestamp()}] ❌ ${msg}`, ...args);
  },
};
