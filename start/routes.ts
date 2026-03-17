import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const HealthController = () => import('#controllers/health_controller')
const InternalAccountsController = () => import('#controllers/internal_accounts_controller')

router.get('/', async () => {
  return {
    service: 'cuentas',
    status: 'ok',
  }
})
router.get('/health', [HealthController, 'index'])

router
  .group(() => {
    router.post('/accounts', [InternalAccountsController, 'store'])
    router.get('/accounts/:slug', [InternalAccountsController, 'show'])
    router.post('/accounts/:slug/sync', [InternalAccountsController, 'sync'])
    router.post('/accounts/:slug/checkin', [InternalAccountsController, 'checkin'])
    router.post('/accounts/:slug/projects/:projectId/receive', [InternalAccountsController, 'receive'])
  })
  .prefix('/internal')
  .use(middleware.internal())
