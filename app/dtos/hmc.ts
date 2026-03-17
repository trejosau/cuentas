export interface HmcConfig {
  android_version?: string
  withdraw_min?: string
  withdraw_max?: string
  withdraw_time?: string
  withdraw_fee?: string
  app_android_download?: string
  share_register_url?: string
  socket_adress?: string
}

export interface HmcLoginResponse {
  token: string
}

export interface HmcCheckinDay {
  day: number
  flag: number
  revenue?: number
  m_id?: number
}

export interface HmcCheckinReward {
  id?: number
  days?: number
  day_revenue?: number
  last_revenue?: number
}

export interface HmcCheckinResponse {
  data: HmcCheckinDay[]
  total_revenue?: number
  continue_days?: number
  msg?: string
}
