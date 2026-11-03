import 'dotenv/config';

import { createEnv, z } from '@chatapp/common';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CHAT_SERVICE_PORT: z.coerce.number().int().min(0).max(65_535).default(4000),
  MONGO_URL: z.string(),
  REDIS_URL: z.string(),
  RABBITMQ_URL: z.string().optional(),
  INTERNAL_API_TOKEN: z.string().min(16),
  JWT_SECRET: z.string().min(32),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
});

type EnvType = z.infer<typeof envSchema>;

export const env: EnvType = createEnv(envSchema, {
  serviceName: 'chat-service',
});

export type Env = typeof env;
