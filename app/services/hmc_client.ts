import type { HmcCheckinDay, HmcCheckinResponse, HmcConfig } from '#dtos/hmc'
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

  private normalizeCheckinDays(data: Array<Record<string, unknown>> | undefined): HmcCheckinDay[] {
    return (data ?? []).map((item) => ({
      day: Number(item.day || 0),
      flag: Number(item.flag || 0),
      revenue: item.revenue !== undefined ? Number(item.revenue || 0) : undefined,
      m_id: item.m_id !== undefined ? Number(item.m_id || 0) : undefined,
    }))
  }

  private requireToken(path: string) {
    if (!this.token) {
      throw new AppException(`HMC ${path}: token ausente para endpoint protegido.`, 409, 'TOKEN_REQUIRED')
    }
  }

  private async request<T>(
    path: string,
    options: {
      body?: Record<string, unknown>
      requiresToken?: boolean
    } = {}
  ) {
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

    if (options.requiresToken) {
      this.requireToken(path)
    }

    if (this.token) {
      headers.token = this.token
    }

    let response: Response
    try {
      response = await fetch(`${env.get('HMC_BASE_URL', 'https://mxg.ht-kook.com')}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(options.body ?? {}),
        signal: AbortSignal.timeout(15_000),
      })
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message.toLowerCase().includes('timeout')
            ? `timeout de conexion`
            : error.message
          : 'error de red'

      throw new AppException(`HMC ${path}: ${message}.`, 502, 'HMC_UPSTREAM_ERROR')
    }

    const rawText = await response.text()
    const payload = rawText ? (JSON.parse(rawText) as HmcEnvelope<T>) : ({}) as HmcEnvelope<T>
    if (!response.ok) {
      const detail = payload.msg || rawText || 'sin detalle'
      throw new AppException(
        `HMC ${path}: HTTP ${response.status} - ${detail}.`,
        response.status,
        'HMC_UPSTREAM_HTTP_ERROR'
      )
    }

    if (payload.code !== 0) {
      throw new AppException(
        `HMC ${path}: code ${payload.code} - ${payload.msg || 'sin detalle'}.`,
        400,
        'HMC_UPSTREAM_REJECTED'
      )
    }

    return payload
  }

  async login(account: string, pwd: string) {
    const payload = await this.request<{ token?: string }>('/login', {
      body: { account, pwd },
    })
    return payload.data?.token || ''
  }

  async userinfo() {
    const payload = await this.request<Record<string, unknown>>('/userinfo', { requiresToken: true })
    return payload.data ?? {}
  }

  async myProjects() {
    const payload = await this.request<{
      my_pro_list?: Array<Record<string, any>>
      total_invest?: number
    }>('/myproList', { requiresToken: true })
    return payload.data ?? {}
  }

  async checkinStatus() {
    const payload = await this.request<Array<Record<string, unknown>>>('/checkin', {
      requiresToken: true,
    })
    return {
      data: this.normalizeCheckinDays(payload.data),
      total_revenue: payload.total_revenue,
      continue_days: payload.continue_days,
      msg: payload.msg,
    } satisfies HmcCheckinResponse
  }

  async performCheckin() {
    const payload = await this.request<Array<Record<string, unknown>>>('/checkin', {
      body: { checkin: 1 },
      requiresToken: true,
    })
    return {
      data: this.normalizeCheckinDays(payload.data),
      total_revenue: payload.total_revenue,
      continue_days: payload.continue_days,
      msg: payload.msg,
    } satisfies HmcCheckinResponse
  }

  async checkConfig() {
    const payload = await this.request<Array<Record<string, unknown>>>('/checkconfig', {
      requiresToken: true,
    })
    return payload.data ?? []
  }

  async getConfig(): Promise<HmcConfig> {
    const payload = await this.request<{ config?: HmcConfig }>('/getconfig')
    return payload.data?.config ?? {}
  }

  async receiveProfit(orderId: number, extraFlag: number) {
    return this.request('/reciveprofit', {
      body: { order_id: orderId, extra_flag: extraFlag },
      requiresToken: true,
    })
  }
}
