import { z } from 'zod';

/**
 * Specify your server-side environment variables schema here. This way you can ensure the app isn't
 * built with invalid env vars.
 */
const server = z.object({
  SERVER_PORT: z.string(),
  STEAM_API_KEY: z.string(),
  REDIS_HOST: z.string(),
  REDIS_USERNAME: z.string(),
  REDIS_PASSWORD: z.string(),
  REDIS_PORT: z.string(),
  REDIS_MAIN_DB: z.string(),
  REDIS_QUEUE_DB: z.string(),
  CORS_ORIGINS: z.string(),
  RATE_LIMIT_MAX: z.string(),
  RATE_LIMIT_TIME_WINDOW: z.string(),
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
 * middlewares) or client-side so we need to destruct manually.
 *
 * @type {Record<keyof z.infer<typeof server>, string | undefined>}
 */
const processEnv = {
  SERVER_PORT: process.env.SERVER_PORT,
  STEAM_API_KEY: process.env.STEAM_API_KEY,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_USERNAME: process.env.REDIS_USERNAME,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_MAIN_DB: process.env.REDIS_MAIN_DB,
  REDIS_QUEUE_DB: process.env.REDIS_QUEUE_DB,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_TIME_WINDOW: process.env.RATE_LIMIT_TIME_WINDOW,
  NODE_ENV: process.env.NODE_ENV,
};

// @ts-expect-error We haven't parsed the env vars yet so we can't guarantee the types.
let env: z.infer<typeof server> = process.env;

if (!!process.env.SKIP_ENV_VALIDATION == false) {
  const parsed = server.safeParse(processEnv);

  if (parsed.success === false) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  env = new Proxy(parsed.data, {
    get(target, prop) {
      if (typeof prop !== 'string') return undefined;

      return target[prop as keyof typeof target];
    },
  });
}

export { env };
