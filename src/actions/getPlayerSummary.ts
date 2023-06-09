import fetch from 'node-fetch';
import SteamID from 'steamid';
import { z } from 'zod';

import { env } from '~/env';
import { playerSchema } from '~/types/Player.types';
import { getCityForId } from './getCityForId';

const requestSchema = z.object({
  response: z.object({
    players: z.array(playerSchema),
  }),
});

export const getPlayerSummaries = async (steamIds: string[]) => {
  const profileData = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${
      env.STEAM_API_KEY
    }&steamids=${steamIds.join(',')}`,
    {
      method: 'GET',
    },
  ).then((res) => res.json());
  const parsedProfileData = requestSchema.safeParse(profileData);
  if (!parsedProfileData.success) {
    return {
      error: parsedProfileData.error,
      message: 'Failed to parse profile data',
    };
  }

  parsedProfileData.data.response.players.sort((a, b) => {
    const aId = new SteamID(a.steamid).accountid;
    const bId = new SteamID(b.steamid).accountid;
    if (aId < bId) {
      return -1;
    }
    if (aId > bId) {
      return 1;
    }
    return 0;
  });
  const mappedPlayers = parsedProfileData.data.response.players.map(async (player) => {
    const accountId = new SteamID(player.steamid).accountid;
    if (player.loccityid) {
      const city = await getCityForId(player.loccityid);
      return { ...player, accountId, city: city };
    }
    return { ...player, accountId };
  });
  const awaitedPlayers = await Promise.all(mappedPlayers);

  return { data: awaitedPlayers };
};
