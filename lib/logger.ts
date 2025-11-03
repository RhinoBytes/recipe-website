// lib/logger.ts
import pino from 'pino';

const pinoOptions = {
  level: 'info',
  // Redact sensitive information for security
  redact: {
    paths: ['email', 'password', 'user.email', 'user.name', 'ipAddress'],
    censor: '[REDACTED]',
  },
};

// Use pino-pretty only in development (next dev)
// Production builds (including Vercel) will use JSON format for optimal log collection
const logger = pino(
  process.env.NODE_ENV === 'development'
    ? {
        ...pinoOptions,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            levelFirst: true,
          },
        },
      }
    : pinoOptions
);

export const log = logger;
