export interface HmcLoginResponse {
  token: string
}

export interface HmcCheckinResponse {
  data: Array<Record<string, unknown>>
  total_revenue?: number
  continue_days?: number
  msg?: string
}
