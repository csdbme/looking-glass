import { Worker, type Job } from 'bullmq';

import { connection } from '~/queue';
import { getPlayerSummaries } from '~/actions/getPlayerSummary';

export const registerProfileDataWorker = () => {
  new Worker(
    'profileData',
    async (
      job: Job<{
        steamIds: string[];
      }>,
    ) => {
      const { steamIds } = job.data;
      if (!steamIds || !steamIds.length) {
        throw new Error('No steamIds provided');
      }

      if (steamIds.length > 100) {
        throw new Error('Too many steamIds provided');
      }

      const playerSummaries = await getPlayerSummaries(steamIds);
      if (playerSummaries.error) {
        throw playerSummaries.error;
      }

      return {
        data: playerSummaries.data,
      };
    },
    {
      concurrency: 4,
      connection,
    },
  );
};
