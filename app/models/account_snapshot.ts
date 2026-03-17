import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AccountSnapshot extends BaseModel {
  static table = 'account_snapshots'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare managedAccountId: number

  @column()
  declare availableBalance: string

  @column()
  declare todayProfit: string

  @column()
  declare yesterdayProfit: string

  @column()
  declare totalProfit: string

  @column()
  declare totalAssets: string

  @column()
  declare recharge: string

  @column()
  declare activeProjects: number

  @column()
  declare canCheckin: boolean

  @column()
  declare payload: Record<string, unknown>

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
