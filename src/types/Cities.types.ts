import { z } from 'zod';

export const citiesSchema = z.record(
  z.string(),
  z.object({
    name: z.string(),
    coordinates: z.object({
      err: z.union([z.string(), z.object({})]).optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    }),
    states: z
      .record(
        z.string(),
        z.object({
          name: z.string(),
          coordinates: z.object({
            err: z.union([z.string(), z.object({})]).optional(),
            lat: z.number().optional(),
            lng: z.number().optional(),
          }),
          cities: z
            .record(
              z.string(),
              z.object({
                name: z.string(),
                coordinates: z.object({
                  err: z.union([z.string(), z.object({})]).optional(),
                  lat: z.number().optional(),
                  lng: z.number().optional(),
                }),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
  }),
);
