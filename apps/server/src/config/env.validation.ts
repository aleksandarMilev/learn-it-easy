import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3_000),
  DATABASE_URL: z.url(),
  REDIS_PORT: z.coerce.number().default(6_379),
});

export type Env = z.infer<typeof envSchema>;
