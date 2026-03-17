import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class ManagedAccount extends BaseModel {
  static table = 'managed_accounts'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare account: string

  @column({ serializeAs: null })
  declare password: string

  @column({ serializeAs: null })
  declare token: string

  @column()
  declare containerCode: string | null

  @column()
  declare status: string

  @column()
  declare tokenStatus: string

  @column()
  declare lastError: string | null

  @column()
  declare tokenExpiresAt: number | null

  @column.dateTime()
  declare lastSyncedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
