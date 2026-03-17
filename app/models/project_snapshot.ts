import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ProjectSnapshot extends BaseModel {
  static table = 'project_snapshots'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare managedAccountId: number

  @column()
  declare remoteOrderId: number

  @column()
  declare orderNo: string | null

  @column()
  declare projectName: string

  @column()
  declare payAmount: string

  @column()
  declare dailyProfit: string

  @column()
  declare totalIncome: string

  @column()
  declare totalRevenue: string

  @column()
  declare periodDays: number

  @column()
  declare runStatus: number

  @column()
  declare isReceive: boolean

  @column()
  declare extraFlag: number

  @column()
  declare endTime: number

  @column()
  declare receiveTime: number | null

  @column()
  declare iconUrl: string | null

  @column()
  declare descriptionHtml: string | null

  @column()
  declare payload: Record<string, unknown>

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
