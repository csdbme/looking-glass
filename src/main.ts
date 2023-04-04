import fastify, { type FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';

import { env } from '~/env';
import { logger } from '~/log';
import { registerProfileDataWorker } from './worker/ProfileData';
import { getSteamIdBatch } from './steam/batcher';
import { profileDataQueue, profileDataQueueEvents } from './queue';

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

  const batchers: { [key: string]: ReturnType<typeof getSteamIdBatch> } = {};

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
      const { client_id, start = '1', batchSize = '100' } = req.query;
      if (!client_id) {
        await res.status(400).send({ error: 'No client_id provided' });
        return;
      }

      let batcher = batchers[client_id];
      if (!batcher) {
        batcher = batchers[client_id] = getSteamIdBatch({
          start: parseInt(start.toString(), 10),
          batchSize: parseInt(batchSize.toString(), 10),
        });
      }

      const batch = batcher.next().value;

      if (!batch) {
        logger.info(`[ID: ${client_id}] No more steamIds`);
        await res.status(500).send({ error: 'No more steamIds' });
        return;
      }

      logger.info(
        `[ID: ${client_id}] Requesting profile data. Start: ${start}, batchSize: ${batchSize}, current: ${batch.current}`,
      );

      const job = await profileDataQueue.add('profileData', {
        steamIds: batch.steamIds,
      });

      const result = await job.waitUntilFinished(profileDataQueueEvents);

      await res.send({
        result,
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
