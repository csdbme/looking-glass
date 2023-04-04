# Looking Glass

Looking Glass can incrementally scan SteamIDs and find their public information. It can also scan SteamIDs for their friends and their friends' friends, and so on.

Also, it can get info for SteamIDs directly.

## Usage

### Incremental scanning

URL: `http://127.0.0.1:4010/getIncrementalProfileData`
METHOD: `GET`

PARAMS:

- `client_id`: A unique Identifier for the client. This is used to keep track of the last SteamID scanned. (one String)
- `start`: The Number to start scanning from.
- `batchSize`: The Number of SteamIDs to scan in one batch. (max 100)

EXAMPLE RESPONSE:

```json
{
  "result": {
    "current": 1,
    "data": [
      {
        "steamid": "76561197960265734",
        "communityvisibilitystate": 3,
        "profilestate": 1,
        "personaname": "derrickb",
        "profileurl": "https://steamcommunity.com/profiles/76561197960265734/",
        "avatar": "https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg",
        "avatarmedium": "https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg",
        "avatarfull": "https://avatars.akamai.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
        "avatarhash": "fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb",
        "personastate": 0,
        "personastateflags": 0,
        "primaryclanid": "103582791429521408",
        "timecreated": 1063215619,
        "accountId": 6
      }
    ]
  }
}
```
