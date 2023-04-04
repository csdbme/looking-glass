import fastify, { type FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';

import { env } from '~/env';
import { logger } from '~/log';
import { registerProfileDataWorker } from './worker/ProfileData';
import { getSteamIdBatch } from './steam/batcher';
import { profileDataQueue, profileDataQueueEvents } from './queue';
import { log } from 'console';

const startServer = async () => {
  const app = fastify();

  const origins = env.CORS_ORIGINS.split(',');
  if (origins.length === 0) {
    logger.error('No CORS origins specified');
    process.exit(1);
  }

  await app.register(fastifyCors, {
    origin: origins,
  });

  registerProfileDataWorker();

  const batcherState: {
    [clientId: string]: {
      current: number;
      options: { start: number; batchSize: number };
    };
  } = {};

  app.get(
    '/getIncrementalProfileData',
    async (
      req: FastifyRequest<{
        Querystring: {
          client_id: string;
          start?: string;
          batchSize?: string;
        };
      }>,
      res,
    ) => {
      const { client_id, start = '0', batchSize = '100' } = req.query;
      if (!client_id) {
        await res.status(400).send({ error: 'No client_id provided' });
        return;
      }

      const state = batcherState[client_id] ?? {
        current: parseInt(start.toString(), 10),
        options: {
          start: parseInt(start.toString(), 10),
          batchSize: parseInt(batchSize.toString(), 10),
        },
      };
      if (batchSize !== state.options.batchSize.toString()) {
        logger.info(
          `[ID: ${client_id}] Batch size changed. Old: ${state.options.batchSize}, new: ${batchSize}`,
        );
        state.options.batchSize = parseInt(batchSize.toString(), 10);
      }

      const batcher = getSteamIdBatch({
        start: state.current + 1, // + 1 because the current batch is already done
        batchSize: state.options.batchSize,
      });

      const batch = batcher.next().value;

      if (!batch) {
        logger.info(`[ID: ${client_id}] No more steamIds`);
        await res.status(500).send({ error: 'No more steamIds' });
        return;
      }

      state.current = batch.current;
      batcherState[client_id] = state;

      logger.info(
        `[ID: ${client_id}] Requesting profile data. Start: ${start}, batchSize: ${batchSize}, current: ${batch.current}`,
      );

      const job = await profileDataQueue.add('profileData', {
        steamIds: batch.steamIds,
      });

      const result = await job.waitUntilFinished(profileDataQueueEvents);

      await res.send({
        result: {
          current: state.current,
          data: result.data,
        },
      });
    },
  );

  app.get(
    '/playerSummaries',
    async (
      req: FastifyRequest<{
        Querystring: {
          client_id: string;
          steamIds: string;
        };
      }>,
      res,
    ) => {
      if (!req.query.client_id) {
        await res.status(400).send({ error: 'No client_id provided' });
        return;
      }

      if (!req.query.steamIds) {
        await res.status(400).send({ error: 'No steamIds provided' });
        return;
      }

      const steamIds = req.query.steamIds.split(',');
      if (steamIds.length > 100) {
        await res.status(400).send({ error: 'Too many steamIds provided' });
        return;
      }
      logger.info(
        `[ID: ${req.query.client_id}] Requesting profile data for ${steamIds.length} steamIds`,
      );
      const job = await profileDataQueue.add('profileData', {
        steamIds,
      });

      const result = await job.waitUntilFinished(profileDataQueueEvents);

      await res.send({
        result,
      });
    },
  );

  await app
    .listen({
      port: +env.SERVER_PORT,
    })
    .then(() => {
      logger.info(`Looking Glass listening on port ${env.SERVER_PORT}`);
    })
    .catch((err) => {
      logger.error('Fastify error: ', err);
      process.exit(1);
    });
};

void startServer();
