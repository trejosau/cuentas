import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Notification extends BaseModel {
  static table = 'notifications'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare level: string

  @column()
  declare scope: string

  @column()
  declare title: string

  @column()
  declare message: string

  @column()
  declare accountSlug: string | null

  @column()
  declare meta: Record<string, unknown>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
