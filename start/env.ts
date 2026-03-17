/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  // Node
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  // App
  APP_KEY: Env.schema.secret(),
  APP_URL: Env.schema.string({ format: 'url', tld: false }),

  // Session
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory', 'database'] as const),

  // Database
  DATABASE_URL: Env.schema.string(),
  DB_SSL: Env.schema.boolean.optional(),

  // Internal service auth
  INTERNAL_API_TOKEN: Env.schema.string(),

  // Container identity
  CONTAINER_CODE: Env.schema.string(),
  CONTAINER_NAME: Env.schema.string(),
  CONTAINER_BASE_URL: Env.schema.string({ format: 'url', tld: false }),
  CONTAINER_MAX_ACCOUNTS: Env.schema.number(),
  SYNC_INTERVAL_MINUTES: Env.schema.number(),
  HEARTBEAT_INTERVAL_SECONDS: Env.schema.number(),
  TOKEN_REFRESH_WINDOW_SECONDS: Env.schema.number(),

  // HMC upstream
  HMC_BASE_URL: Env.schema.string({ format: 'url', tld: false }),
  HMC_ORIGIN: Env.schema.string({ format: 'url', tld: false }),
  HMC_REFERER: Env.schema.string({ format: 'url', tld: false }),
  HMC_USER_AGENT: Env.schema.string(),
})
