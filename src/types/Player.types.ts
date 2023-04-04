import { z } from 'zod';

export enum PersonaState {
  Offline = 0,
  Online = 1,
  Busy = 2,
  Away = 3,
  Snooze = 4,
  LookingToTrade = 5,
  LookingToPlay = 6,
}

export enum CommunityVisibleState {
  Private = 1,
  FriendsOnly = 2,
  Public = 3,
}

export const playerSchema = z.object({
  steamid: z.string(),
  communityvisibilitystate: z.nativeEnum(CommunityVisibleState), // 1 - the profile is not visible to you (Private), 2 - Friends Only, 3 - the profile is "Public", and the data is visible
  profilestate: z.number().optional(), // If set, indicates the user has a community profile configured (will be set to '1')
  personaname: z.string(), // The player's persona name (display name)
  profileurl: z.string().url(), // The full URL of the player's Steam Community profile.
  avatar: z.string().url(), // The full URL of the player's 32x32px avatar. If the user hasn't configured an avatar, this will be the default ? avatar.
  avatarmedium: z.string().url(), // The full URL of the player's 64x64px avatar. If the user hasn't configured an avatar, this will be the default ? avatar.
  avatarfull: z.string().url(), // The full URL of the player's 184x184px avatar. If the user hasn't configured an avatar, this will be the default ? avatar.
  avatarhash: z.string(),
  personastate: z.nativeEnum(PersonaState), // The user's current status. If the player's profile is private, this will always be "0", except is the user has set their status to looking to trade or looking to play, because a bug makes those status appear even if the profile is private.
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
