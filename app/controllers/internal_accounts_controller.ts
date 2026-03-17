import type { HttpContext } from '@adonisjs/core/http'
import { AppException } from '#exceptions/app_exception'
import { AccountSyncService } from '#services/account_sync_service'
import { registerAccountValidator } from '#validators/register_account'

export default class InternalAccountsController {
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(registerAccountValidator)
      const service = new AccountSyncService()
      const account = await service.register(payload)
      return response.created({ data: { slug: account.slug, account: account.account } })
    } catch (error) {
      if (error instanceof AppException) {
        return response.status(error.status).send({ error: error.message, code: error.code })
      }
      throw error
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const service = new AccountSyncService()
      const account = await service.syncBySlug(params.slug, false)
      return response.ok({
        data: {
          slug: account.slug,
          account: account.account,
          status: account.status,
          tokenStatus: account.tokenStatus,
          lastError: account.lastError,
        },
      })
    } catch (error) {
      if (error instanceof AppException) {
        return response.status(error.status).send({ error: error.message, code: error.code })
      }
      throw error
    }
  }

  async sync({ params, response }: HttpContext) {
    try {
      const service = new AccountSyncService()
      const account = await service.syncBySlug(params.slug, true)
      return response.ok({ data: { slug: account.slug, status: account.status } })
    } catch (error) {
      if (error instanceof AppException) {
        return response.status(error.status).send({ error: error.message, code: error.code })
      }
      throw error
    }
  }

  async checkin({ params, response }: HttpContext) {
    try {
      const service = new AccountSyncService()
      return response.ok({ data: await service.performCheckin(params.slug) })
    } catch (error) {
      if (error instanceof AppException) {
        return response.status(error.status).send({ error: error.message, code: error.code })
      }
      throw error
    }
  }

  async receive({ params, response }: HttpContext) {
    try {
      const projectId = Number(params.projectId)
      if (!Number.isInteger(projectId) || projectId <= 0) {
        throw new AppException('projectId no es valido.', 400)
      }

      const service = new AccountSyncService()
      return response.ok({ data: await service.receiveProfit(params.slug, projectId) })
    } catch (error) {
      if (error instanceof AppException) {
        return response.status(error.status).send({ error: error.message, code: error.code })
      }
      throw error
    }
  }
}
