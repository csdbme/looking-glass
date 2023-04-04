import { getCityJson } from './getCityJson';

export const getCityForId = async (id: number) => {
  const json = await getCityJson();

  if (!json) return undefined;

  let returnCity;
  Object.values(json).forEach((country) => {
    if (!country.states) return undefined;
    Object.values(country.states).forEach((state) => {
      if (!state.cities) return undefined;
      Object.keys(state.cities).forEach((key) => {
        if (!state.cities) return undefined;
        if (key === id.toString()) {
          returnCity = state.cities[key];
        }
      });
    });
  });
  return returnCity;
};
