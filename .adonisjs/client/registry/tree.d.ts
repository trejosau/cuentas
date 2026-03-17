/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: {
    index: typeof routes['health.index']
  }
  internalAccounts: {
    store: typeof routes['internal_accounts.store']
    show: typeof routes['internal_accounts.show']
    sync: typeof routes['internal_accounts.sync']
    checkin: typeof routes['internal_accounts.checkin']
    receive: typeof routes['internal_accounts.receive']
  }
}
