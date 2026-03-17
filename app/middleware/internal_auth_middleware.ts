import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

export default class InternalAuthMiddleware {
  async handle({ request, response }: HttpContext, next: () => Promise<void>) {
    const header = request.header('x-internal-token')
    if (!header || header !== env.get('INTERNAL_API_TOKEN')) {
      return response.unauthorized({ error: 'No autorizado.' })
    }

    await next()
  }
}
