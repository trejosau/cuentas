import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

export class ContainerRegistryService {
  async heartbeat() {
    await db
      .table('service_nodes')
      .insert({
        code: env.get('CONTAINER_CODE'),
        name: env.get('CONTAINER_NAME'),
        base_url: env.get('CONTAINER_BASE_URL'),
        max_accounts: env.get('CONTAINER_MAX_ACCOUNTS'),
        healthy: true,
        last_heartbeat_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('code')
      .merge({
        name: env.get('CONTAINER_NAME'),
        base_url: env.get('CONTAINER_BASE_URL'),
        max_accounts: env.get('CONTAINER_MAX_ACCOUNTS'),
        healthy: true,
        last_heartbeat_at: new Date(),
        updated_at: new Date(),
      })
  }
}
