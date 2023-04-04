import winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import { env } from '~/env';

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `theia.log`
    //
    new winstonDailyRotateFile({
      frequency: '24h',
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      level: 'error',
    }),
    new winstonDailyRotateFile({
      frequency: '24h',
      filename: 'logs/logs-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
    }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export { logger };
