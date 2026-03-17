import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ServiceNode extends BaseModel {
  static table = 'service_nodes'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare baseUrl: string

  @column()
  declare maxAccounts: number

  @column()
  declare allocationOrder: number

  @column()
  declare enabled: boolean

  @column()
  declare healthy: boolean

  @column.dateTime()
  declare lastHeartbeatAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
