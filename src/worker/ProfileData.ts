import { Worker, type Job } from 'bullmq';
import { z } from 'zod';
import fetch from 'node-fetch';
import { env } from '~/env';
import { connection } from '~/queue';
import SteamID from 'steamid';

export const playerSchema = z.object({
  steamid: z.string(),
  communityvisibilitystate: z.number(), // Only two possible values returned: 1 - the profile is not visible to you (Private, Friends Only, etc), 3 - the profile is "Public", and the data is visible
  profilestate: z.number().optional(), // If set, indicates the user has a community profile configured (will be set to '1')
  personaname: z.string(), // The player's persona name (display name)
  profileurl: z.string(), // The full URL of the player's Steam Community profile.
  avatar: z.string(), // The full URL of the player's 32x32px avatar. If the user hasn't configured an avatar, this will be the default ? avatar.
  avatarmedium: z.string(), // The full URL of the player's 64x64px avatar. If the user hasn't configured an avatar, this will be the default ? avatar.
  avatarfull: z.string(), // The full URL of the player's 184x184px avatar. If the user hasn't configured an avatar, this will be the default ? avatar.
  avatarhash: z.string(),
  personastate: z.union([
    z.literal(0), // 0 - Offline
    z.literal(1), // 1 - Online
    z.literal(2), // 2 - Busy
    z.literal(3), // 3 - Away
    z.literal(4), // 4 - Snooze
    z.literal(5), // 5 - looking to trade
    z.literal(6), // 6 - looking to play
  ]), // The user's current status. If the player's profile is private, this will always be "0", except is the user has set their status to looking to trade or looking to play, because a bug makes those status appear even if the profile is private.
  personastateflags: z.number().optional(),
  commentpermission: z.number().optional(), // If set, indicates the profile allows public comments.

  // Private Data
  realname: z.string().optional(),
  primaryclanid: z.string().optional(),
  timecreated: z.number().optional(),
  loccountrycode: z.string().optional(), // If set on the user's Steam Community profile, The user's country of residence, 2-character ISO country code
  locstatecode: z.string().optional(), // If set on the user's Steam Community profile, The user's state of residence
  loccityid: z.number().optional(),
});

const requestSchema = z.object({
  response: z.object({
    players: z.array(playerSchema),
  }),
});

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

      const profileData = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${
          env.STEAM_API_KEY
        }&steamids=${steamIds.join(',')}`,
        {
          method: 'GET',
        },
      ).then((res) => res.json());
      const parsedProfileData = requestSchema.parse(profileData);
      parsedProfileData.response.players.sort((a, b) => {
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

      return {
        data: parsedProfileData.response.players,
      };
    },
    {
      concurrency: 4,
      connection,
    },
  );
};
