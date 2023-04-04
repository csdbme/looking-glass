import { Queue, QueueEvents, type ConnectionOptions } from 'bullmq';
import { env } from './env';
import { logger } from './log';

export const connection: ConnectionOptions = {
  host: env.REDIS_HOST,
  port: +env.REDIS_PORT,
  username: env.REDIS_USERNAME,
  password: env.REDIS_PASSWORD,
};

export const inventoryQueue = new Queue<
  {
    steamId: string;
  },
  {
    inventory: string;
  }
>('inventory', {
  sharedConnection: true,
  connection,
});

export const inventoryQueueEvents = new QueueEvents('inventory', {
  connection,
});

inventoryQueue.on('error', (err) => {
  logger.error('InventoryQueue error: ', err);
});

inventoryQueueEvents.on('ioredis:close', () => {
  logger.error('InventoryQueueEvents closed');
});

export const profileDataQueue = new Queue<
  {
    steamIds: string[];
  },
  {
    profileData: string;
  }
>('profileData', {
  sharedConnection: true,
  connection,
});

export const profileDataQueueEvents = new QueueEvents('profileData', {
  connection,
});

profileDataQueue.on('error', (err) => {
  logger.error('ProfileDataQueue error: ', err);
});
