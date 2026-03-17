import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const databaseUrl = new URL(env.get('DATABASE_URL'))

const dbConfig = defineConfig({
  connection: 'pg',

  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: databaseUrl.hostname,
        port: Number(databaseUrl.port || 5432),
        user: decodeURIComponent(databaseUrl.username),
        password: decodeURIComponent(databaseUrl.password),
        database: databaseUrl.pathname.replace(/^\//, ''),
        ssl: env.get('DB_SSL', false) ? { rejectUnauthorized: false } : undefined,
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig
