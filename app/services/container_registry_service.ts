import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import {
  inferContainerBaseUrl,
  inferContainerCode,
  inferContainerName,
} from '#utils/runtime_defaults'

export class ContainerRegistryService {
  async heartbeat() {
    const code = env.get('CONTAINER_CODE', inferContainerCode())
    const name = env.get('CONTAINER_NAME', inferContainerName())
    const baseUrl = env.get('CONTAINER_BASE_URL', inferContainerBaseUrl())
    const maxAccounts = env.get('CONTAINER_MAX_ACCOUNTS', 3)

    await db
      .table('service_nodes')
      .insert({
        code,
        name,
        base_url: baseUrl,
        max_accounts: maxAccounts,
        healthy: true,
        last_heartbeat_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict('code')
      .merge({
        name,
        base_url: baseUrl,
        max_accounts: maxAccounts,
        healthy: true,
        last_heartbeat_at: new Date(),
        updated_at: new Date(),
      })
  }
}
