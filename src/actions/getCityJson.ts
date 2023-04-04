import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { citiesSchema } from '~/types/Cities.types';
import { logger } from '~/log';
import { type z } from 'zod';

let citiesJson: z.infer<typeof citiesSchema>;

export const getCityJson = async () => {
  if (citiesJson) return citiesJson;

  const gamefilesFolder = `${process.cwd()}/game_data`;
  if (!(await fs.stat(gamefilesFolder).catch(() => false))) {
    await fs.mkdir(gamefilesFolder);
  }

  let gameFiles = await fs.readdir(gamefilesFolder, { withFileTypes: true });
  gameFiles = gameFiles.filter((file) => file.isFile() && file.name === 'steam_countries.json');

  if (gameFiles[0]) {
    const gameFile = gameFiles[0];
    const gameFileData = await fs.readFile(`${gamefilesFolder}/${gameFile.name}`, 'utf8');
    const parseResult = citiesSchema.safeParse(JSON.parse(gameFileData));
    if (!parseResult.success) {
      logger.error(`Failed to parse ${gameFile.name}`);
      console.error(parseResult.error.issues);
      return;
    }
    citiesJson = parseResult.data;
    return parseResult.data;
  } else {
    const cityJson = await fetch(
      'https://raw.githubusercontent.com/quer/steam-friends-countries/master/data/steam_countries.json',
    ).then((res) => res.json());
    await fs.writeFile(`${gamefilesFolder}/steam_countries.json`, JSON.stringify(cityJson));
    const parseResult = citiesSchema.safeParse(cityJson);
    if (!parseResult.success) {
      logger.error(`Failed to parse steam_countries.json`);
      return;
    }
    citiesJson = parseResult.data;
    return parseResult.data;
  }
};
