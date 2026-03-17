import vine from '@vinejs/vine'

export const registerAccountValidator = vine.create({
  slug: vine.string().trim().maxLength(160),
  account: vine.string().trim().maxLength(64),
  pwd: vine.string().trim().maxLength(255),
  containerCode: vine.string().trim().maxLength(120),
})
