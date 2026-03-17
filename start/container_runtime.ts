import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { ContainerRegistryService } from '#services/container_registry_service'
import { AccountSyncService } from '#services/account_sync_service'

const registry = new ContainerRegistryService()
const syncService = new AccountSyncService()

async function safeHeartbeat() {
  try {
    await registry.heartbeat()
  } catch (error) {
    logger.error({ err: error }, 'No se pudo actualizar el heartbeat del contenedor')
  }
}

async function safeSync() {
  try {
    await syncService.syncAssignedAccounts()
  } catch (error) {
    logger.error({ err: error }, 'No se pudo sincronizar las cuentas asignadas')
  }
}

void safeHeartbeat()
setInterval(() => void safeHeartbeat(), env.get('HEARTBEAT_INTERVAL_SECONDS', 60) * 1000)

setTimeout(() => void safeSync(), 1500)
setInterval(() => void safeSync(), env.get('SYNC_INTERVAL_MINUTES', 30) * 60_000)
