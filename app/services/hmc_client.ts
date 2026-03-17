import type { HmcCheckinResponse } from '#dtos/hmc'
import env from '#start/env'
import { AppException } from '#exceptions/app_exception'

interface HmcEnvelope<T = unknown> {
  code: number
  msg?: string
  data?: T
  received?: string
  total_revenue?: number
  continue_days?: number
}

export class HmcClient {
  constructor(private readonly token = '') {}

  private async request<T>(path: string, body?: Record<string, unknown>) {
    const headers: Record<string, string> = {
      accept: '*/*',
      'content-type': 'application/json',
      origin: env.get('HMC_ORIGIN', 'https://www.hmc-mex.com'),
      referer: env.get('HMC_REFERER', 'https://www.hmc-mex.com/'),
      'user-agent': env.get(
        'HMC_USER_AGENT',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0'
      ),
    }

    if (this.token) {
      headers.token = this.token
    }

    const response = await fetch(`${env.get('HMC_BASE_URL', 'https://mxg.ht-kook.com')}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const payload = (await response.json().catch(() => ({}))) as HmcEnvelope<T>
    if (!response.ok) {
      throw new AppException(payload.msg || 'Fallo la solicitud contra HMC.', response.status)
    }

    if (payload.code !== 0) {
      throw new AppException(payload.msg || 'HMC rechazo la solicitud.')
    }

    return payload
  }

  async login(account: string, pwd: string) {
    const payload = await this.request<{ token?: string }>('/login', { account, pwd })
    return payload.data?.token || ''
  }

  async userinfo() {
    const payload = await this.request<Record<string, unknown>>('/userinfo')
    return payload.data ?? {}
  }

  async myProjects() {
    const payload = await this.request<{
      my_pro_list?: Array<Record<string, any>>
      total_invest?: number
    }>('/myproList')
    return payload.data ?? {}
  }

  async checkinStatus() {
    const payload = await this.request<Array<Record<string, unknown>>>('/checkin')
    return {
      data: payload.data ?? [],
      total_revenue: payload.total_revenue,
      continue_days: payload.continue_days,
      msg: payload.msg,
    } satisfies HmcCheckinResponse
  }

  async performCheckin() {
    const payload = await this.request<Array<Record<string, unknown>>>('/checkin', { checkin: 1 })
    return {
      data: payload.data ?? [],
      total_revenue: payload.total_revenue,
      continue_days: payload.continue_days,
      msg: payload.msg,
    } satisfies HmcCheckinResponse
  }

  async checkConfig() {
    const payload = await this.request<Array<Record<string, unknown>>>('/checkconfig')
    return payload.data ?? []
  }

  async receiveProfit(orderId: number, extraFlag: number) {
    return this.request('/reciveprofit', { order_id: orderId, extra_flag: extraFlag })
  }
}
