import { test } from '@japa/runner'
import ManagedAccount from '#models/managed_account'
import { AppException } from '#exceptions/app_exception'
import { HmcClient } from '#services/hmc_client'
import { AccountSyncService } from '#services/account_sync_service'

test.group('token refresh', () => {
  test('classifies HMC code -2 in spanish as auth invalid', async ({ assert }) => {
    const client = new HmcClient('expired-token') as any

    client.send = async () => ({
      statusCode: 200,
      rawText: JSON.stringify({
        code: -2,
        msg: 'La sesion ha expirado o el usuario no ha iniciado sesion.',
      }),
    })

    try {
      await client.checkinStatus()
      assert.fail('Expected checkinStatus to throw HMC_AUTH_INVALID')
    } catch (error) {
      assert.instanceOf(error, AppException)
      assert.equal((error as AppException).code, 'HMC_AUTH_INVALID')
    }
  })

  test('refreshes expired tokens before invoking protected actions', async ({ assert }) => {
    const service = new AccountSyncService() as any
    const account = new ManagedAccount() as ManagedAccount & { save: () => Promise<ManagedAccount> }

    account.account = 'demo'
    account.password = 'secret'
    account.token = 'expired-token'
    account.tokenStatus = 'active'
    account.tokenExpiresAt = Math.floor(Date.now() / 1000) - 30
    account.save = async () => account

    let refreshCount = 0
    service.refreshToken = async (managedAccount: ManagedAccount) => {
      refreshCount += 1
      managedAccount.token = 'fresh-token'
      managedAccount.tokenStatus = 'active'
      managedAccount.tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600
    }

    const tokenUsed = await service.withAuthRetry(account, async (client: HmcClient) => {
      return (client as any).token
    })

    assert.equal(refreshCount, 1)
    assert.equal(tokenUsed, 'fresh-token')
  })

  test('retries once with a fresh token after auth invalid', async ({ assert }) => {
    const service = new AccountSyncService() as any
    const account = new ManagedAccount() as ManagedAccount & { save: () => Promise<ManagedAccount> }

    account.account = 'demo'
    account.password = 'secret'
    account.token = 'old-token'
    account.tokenStatus = 'active'
    account.tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600
    account.save = async () => account

    let refreshCount = 0
    let attempt = 0
    service.refreshToken = async (managedAccount: ManagedAccount) => {
      refreshCount += 1
      managedAccount.token = 'renewed-token'
      managedAccount.tokenStatus = 'active'
      managedAccount.tokenExpiresAt = Math.floor(Date.now() / 1000) + 3600
    }

    const result = await service.withAuthRetry(account, async (client: HmcClient) => {
      attempt += 1
      const currentToken = (client as any).token

      if (attempt === 1) {
        assert.equal(currentToken, 'old-token')
        throw new AppException('Sesion expirada.', 401, 'HMC_AUTH_INVALID')
      }

      assert.equal(currentToken, 'renewed-token')
      return 'ok'
    })

    assert.equal(result, 'ok')
    assert.equal(refreshCount, 1)
    assert.equal(attempt, 2)
  })
})
