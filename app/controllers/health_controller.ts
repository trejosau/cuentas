import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'

export default class HealthController {
  async index({ response }: HttpContext) {
    const totalAccountsRow = (await db
      .from('managed_accounts')
      .where('container_code', env.get('CONTAINER_CODE'))
      .count('* as total')
      .first()) as { total?: string | number } | null
    const totalAccounts = Number(totalAccountsRow?.total || 0)

    return response.ok({
      service: 'cuentas',
      status: 'ok',
      containerCode: env.get('CONTAINER_CODE'),
      totalAccounts,
    })
  }
}
