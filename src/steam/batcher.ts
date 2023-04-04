import SteamID from 'steamid';

export function* getSteamIdBatch(
  options: { start: number; batchSize: number } = { start: 1, batchSize: 100 },
) {
  const start = options.start;
  const batchSize = options.batchSize;

  let batch: string[] = [];

  for (let i = start; i < start + batchSize; ++i) {
    const steamId = SteamID.fromIndividualAccountID(i);
    batch.push(steamId.getSteamID64());

    if (batch.length === batchSize) {
      const copiedBatch = [...batch];
      batch = [];
      yield { steamIds: copiedBatch, current: i };
    }
  }
}
