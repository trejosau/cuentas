import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class CheckinSnapshot extends BaseModel {
  static table = 'checkin_snapshots'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare managedAccountId: number

  @column()
  declare continueDays: number

  @column()
  declare totalRevenue: string

  @column()
  declare currentDay: number | null

  @column()
  declare todayFlag: number | null

  @column()
  declare canCheckin: boolean

  @column()
  declare calendar: Array<Record<string, unknown>>

  @column()
  declare rewards: Array<Record<string, unknown>>

  @column()
  declare payload: Record<string, unknown>

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
