import SteamID from 'steamid';

export function* getSteamIdBatch(
  options: { start: number; batchSize: number } = { start: 1, batchSize: 100 },
) {
  const { start, batchSize } = options;

  let batch: string[] = [];
  let current = start;
  while (true) {
    const steamId = SteamID.fromIndividualAccountID(current);
    batch.push(steamId.getSteamID64());
    if (batch.length === batchSize) {
      yield { steamIds: batch, current };
      batch = [];
    }
    current++;
  }
}
