import * as http from 'node:http'
import * as https from 'node:https'
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

  private normalizeMessage(value: string | undefined) {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  private isAuthFailureMessage(value: string | undefined) {
    const normalized = this.normalizeMessage(value)
    if (!normalized) return false

    return [
      'sessao expirada',
      'sessao expirou',
      'session expired',
      'login expirou',
      'efetue login novamente',
      'usuario nao esta conectado',
      'user is not connected',
      'not connected',
      'token invalido',
      'invalid token',
      'unauthorized',
    ].some((fragment) => normalized.includes(fragment))
  }

  private buildResponseSnippet(rawText: string) {
    return rawText.replace(/\s+/g, ' ').trim().slice(0, 180) || 'sin detalle'
  }

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

  private async send(path: string, body: Record<string, unknown>) {
    const baseUrl = env.get('HMC_BASE_URL', 'https://mxg.ht-kook.com')
    const url = new URL(path, baseUrl)
    const payload = JSON.stringify(body)
    const transport = url.protocol === 'https:' ? https : http

    return new Promise<{ statusCode: number; rawText: string }>((resolve, reject) => {
      const request = transport.request(
        url,
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            Origin: env.get('HMC_ORIGIN', 'https://www.hmc-mex.com'),
            Referer: env.get('HMC_REFERER', 'https://www.hmc-mex.com/'),
            'User-Agent': env.get(
              'HMC_USER_AGENT',
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36 Edg/146.0.0.0'
            ),
            Token: this.token || '',
          },
        },
        (response) => {
          let rawText = ''
          response.setEncoding('utf8')
          response.on('data', (chunk) => {
            rawText += chunk
          })
          response.on('end', () => {
            resolve({
              statusCode: response.statusCode || 500,
              rawText,
            })
          })
        }
      )

      request.setTimeout(15_000, () => {
        request.destroy(new Error('timeout de conexion'))
      })

      request.on('error', reject)
      request.write(payload)
      request.end()
    })
  }

  private async request<T>(
    path: string,
    options: {
      body?: Record<string, unknown>
      requiresToken?: boolean
    } = {}
  ) {
    if (options.requiresToken) {
      this.requireToken(path)
    }

    let response: { statusCode: number; rawText: string }
    try {
      response = await this.send(path, options.body ?? {})
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message.toLowerCase().includes('timeout')
            ? `timeout de conexion`
            : error.message
          : 'error de red'

      throw new AppException(`HMC ${path}: ${message}.`, 502, 'HMC_UPSTREAM_ERROR')
    }

    const { rawText } = response
    if (!rawText) {
      throw new AppException(
        `HMC ${path}: respuesta vacia inesperada.`,
        502,
        'HMC_UPSTREAM_EMPTY_RESPONSE'
      )
    }

    let payload: HmcEnvelope<T>
    try {
      payload = JSON.parse(rawText) as HmcEnvelope<T>
    } catch {
      const label = rawText.trimStart().startsWith('<')
        ? 'respuesta HTML inesperada'
        : 'respuesta no JSON'
      throw new AppException(
        `HMC ${path}: ${label} - ${this.buildResponseSnippet(rawText)}.`,
        502,
        'HMC_UPSTREAM_INVALID_RESPONSE'
      )
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      const detail = payload.msg || this.buildResponseSnippet(rawText)
      if (options.requiresToken && [401, 403].includes(response.statusCode)) {
        throw new AppException(`HMC ${path}: ${detail}.`, 401, 'HMC_AUTH_INVALID')
      }

      throw new AppException(
        `HMC ${path}: HTTP ${response.statusCode} - ${detail}.`,
        response.statusCode,
        'HMC_UPSTREAM_HTTP_ERROR'
      )
    }

    if (payload.code !== 0) {
      if (options.requiresToken && this.isAuthFailureMessage(payload.msg)) {
        throw new AppException(`HMC ${path}: ${payload.msg || 'sesion invalida'}.`, 401, 'HMC_AUTH_INVALID')
      }

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
