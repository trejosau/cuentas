import type { HmcCheckinResponse, HmcConfig } from '#dtos/hmc'
import AccountSnapshot from '#models/account_snapshot'
import ManagedAccount from '#models/managed_account'
import ProjectSnapshot from '#models/project_snapshot'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import { AppException } from '#exceptions/app_exception'
import { HmcClient } from '#services/hmc_client'
import { NotificationService } from '#services/notification_service'
import { decodeTokenExpiry } from '#utils/jwt'
import { toNumber } from '#utils/numbers'
import { inferContainerCode } from '#utils/runtime_defaults'

export class AccountSyncService {
  constructor(private readonly notifications = new NotificationService()) {}

  async register(input: { slug: string; account: string; pwd: string; containerCode: string }) {
    const containerCode = env.get('CONTAINER_CODE', inferContainerCode())
    if (input.containerCode !== containerCode) {
      throw new AppException(
        `Esta instancia solo administra ${containerCode}.`,
        409,
        'WRONG_CONTAINER'
      )
    }

    let account: ManagedAccount | null = null

    try {
      account = await ManagedAccount.create({
        slug: input.slug,
        account: input.account,
        password: input.pwd,
        token: '',
        containerCode: input.containerCode,
        status: 'pending',
        tokenStatus: 'inactive',
        lastError: null,
      })

      await this.syncAccount(account, true)
      return this.requireAssignedAccount(input.slug)
    } catch (error) {
      if (account) {
        await account.delete()
      }
      throw error
    }
  }

  async syncBySlug(slug: string, forceLogin = false) {
    const account = await this.requireAssignedAccount(slug)
    await this.syncAccount(account, forceLogin)
    return this.requireAssignedAccount(slug)
  }

  async performCheckin(slug: string) {
    const account = await this.requireAssignedAccount(slug)
    const result = await this.withAuthRetry(account, (client) => client.performCheckin())
    await this.syncAccount(account, false)

    await this.notifications.push({
      level: 'success',
      scope: 'checkin',
      title: 'Check-In realizado',
      message: `${account.account} realizo su check-in.`,
      accountSlug: slug,
    })

    return result
  }

  async receiveProfit(slug: string, projectId: number) {
    const account = await this.requireAssignedAccount(slug)
    const project = await ProjectSnapshot.find(projectId)
    if (!project || project.managedAccountId !== account.id) {
      throw new AppException('El proyecto solicitado no existe para esta cuenta.', 404)
    }

    const result = await this.withAuthRetry(account, (client) =>
      client.receiveProfit(project.remoteOrderId, project.extraFlag)
    )
    await this.syncAccount(account, false)

    await this.notifications.push({
      level: 'success',
      scope: 'profit',
      title: 'Cobro realizado',
      message: `${account.account} cobro ${project.projectName}.`,
      accountSlug: slug,
      meta: { projectId, received: result.received ?? null },
    })

    return result
  }

  async syncAssignedAccounts() {
    const containerCode = env.get('CONTAINER_CODE', inferContainerCode())
    const accounts = await ManagedAccount.query()
      .where('containerCode', containerCode)
      .orderBy('createdAt', 'asc')

    for (const account of accounts) {
      if (!this.shouldSync(account)) {
        continue
      }

      await this.syncAccount(account, false)
    }
  }

  private shouldSync(account: ManagedAccount) {
    if (!account.lastSyncedAt || account.lastError || !account.token) {
      return true
    }

    const minutesSinceSync = DateTime.now().diff(account.lastSyncedAt, 'minutes').minutes
    return minutesSinceSync >= env.get('SYNC_INTERVAL_MINUTES', 30)
  }

  private async createAuthenticatedClient(account: ManagedAccount) {
    if (!account.token) {
      await this.refreshToken(account)
    }

    if (!account.token) {
      throw new AppException('La cuenta no tiene token activo.', 409)
    }

    const client = new HmcClient(account.token)
    return client
  }

  private isAuthInvalidError(error: unknown) {
    return error instanceof AppException && error.code === 'HMC_AUTH_INVALID'
  }

  private async withAuthRetry<T>(
    account: ManagedAccount,
    callback: (client: HmcClient) => Promise<T>,
    options: { forceLogin?: boolean } = {}
  ) {
    if (options.forceLogin || !account.token) {
      await this.refreshToken(account)
    }

    try {
      return await callback(await this.createAuthenticatedClient(account))
    } catch (error) {
      if (!this.isAuthInvalidError(error)) {
        throw error
      }

      await this.refreshToken(account)
      return callback(await this.createAuthenticatedClient(account))
    }
  }

  private async refreshToken(account: ManagedAccount) {
    const token = await new HmcClient().login(account.account, account.password)
    if (!token) {
      throw new AppException('El login no devolvio token.', 502)
    }

    account.token = token
    account.tokenExpiresAt = decodeTokenExpiry(token)
    account.tokenStatus = 'active'
    account.status = 'active'
    account.lastError = null
    await account.save()
  }

  private async syncAccount(account: ManagedAccount, forceLogin: boolean) {
    try {
      const config = await new HmcClient().getConfig().catch((error) => {
        logger.warn({ err: error, account: account.account }, 'Fallo getconfig, se continua con el sync')
        return null
      })

      const [profile, projectsPayload, checkinPayload, rewards] = await this.withAuthRetry(
        account,
        (client) =>
          Promise.all([client.userinfo(), client.myProjects(), client.checkinStatus(), client.checkConfig()]),
        { forceLogin }
      )

      await this.persistProfile(account, profile, projectsPayload, config)
      await this.persistProjects(account, projectsPayload.my_pro_list ?? [])
      await this.persistCheckin(account, checkinPayload, rewards)

      account.status = 'active'
      account.tokenStatus = 'active'
      account.lastError = null
      account.lastSyncedAt = DateTime.now()
      await account.save()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo sincronizar la cuenta.'
      account.status = 'error'
      account.tokenStatus = this.isAuthInvalidError(error) || !account.token ? 'inactive' : account.tokenStatus
      account.lastError = message
      account.lastSyncedAt = DateTime.now()
      await account.save()

      await this.notifications.push({
        level: 'error',
        scope: 'sync',
        title: 'Sincronizacion fallida',
        message: `${account.account}: ${message}`,
        accountSlug: account.slug,
      })

      logger.error({ err: error, account: account.account }, 'Fallo la sincronizacion del contenedor')
      throw error
    }
  }

  private async persistProfile(
    account: ManagedAccount,
    profile: Record<string, unknown>,
    projectsPayload: Record<string, any>,
    config: HmcConfig | null
  ) {
    const projects = Array.isArray(projectsPayload.my_pro_list) ? projectsPayload.my_pro_list : []
    const snapshotPayload = config ? { profile, config } : profile

    await db
      .table('account_snapshots')
      .insert({
        managed_account_id: account.id,
        available_balance: toNumber(profile.balance),
        today_profit: toNumber(profile.today_profit),
        yesterday_profit: toNumber(profile.yesterday_profit),
        total_profit: toNumber(profile.total_profit),
        total_assets: toNumber(profile.total_assets),
        recharge: toNumber(profile.recharge),
        active_projects: projects.filter((item) => Number(item.run_status || 0) === 1).length,
        can_checkin: false,
        payload: JSON.stringify(snapshotPayload),
        updated_at: new Date(),
      })
      .onConflict('managed_account_id')
      .merge({
        available_balance: toNumber(profile.balance),
        today_profit: toNumber(profile.today_profit),
        yesterday_profit: toNumber(profile.yesterday_profit),
        total_profit: toNumber(profile.total_profit),
        total_assets: toNumber(profile.total_assets),
        recharge: toNumber(profile.recharge),
        active_projects: projects.filter((item) => Number(item.run_status || 0) === 1).length,
        payload: JSON.stringify(snapshotPayload),
        updated_at: new Date(),
      })
  }

  private async persistProjects(account: ManagedAccount, projects: Array<Record<string, any>>) {
    await ProjectSnapshot.query().where('managedAccountId', account.id).delete()

    const rows = projects.map((item) => ({
      managed_account_id: account.id,
      remote_order_id: Number(item.id || 0),
      order_no: String(item.order_No || ''),
      project_name: String(item.proinfo?.pro_name || 'Proyecto'),
      pay_amount: toNumber(item.pay_amount),
      daily_profit: toNumber(item.productivity ?? item.proinfo?.productivity),
      total_income: toNumber(item.proinfo?.total_income),
      total_revenue: toNumber(item.total_revenue),
      period_days: Number(item.proinfo?.period || 0),
      run_status: Number(item.run_status || 0),
      is_receive: Number(item.is_receive || 0) === 1,
      extra_flag: Number(item.extra_flag || 0),
      end_time: Number(item.end_time || 0),
      receive_time: item.receive_time ? Number(item.receive_time) : null,
      icon_url: item.proinfo?.pro_icon ? String(item.proinfo.pro_icon) : null,
      description_html: item.proinfo?.description ? String(item.proinfo.description) : null,
      payload: JSON.stringify(item),
      updated_at: new Date(),
    }))

    if (rows.length > 0) {
      await db.table('project_snapshots').insert(rows)
    }
  }

  private async persistCheckin(
    account: ManagedAccount,
    checkinPayload: HmcCheckinResponse,
    rewards: Array<Record<string, unknown>>
  ) {
    const calendar = Array.isArray(checkinPayload.data) ? checkinPayload.data : []
    const current = calendar.find((item) => Number(item.flag ?? -99) === -2 || Number(item.flag ?? -99) === 1)
    const canCheckin = calendar.some((item) => Number(item.flag ?? -99) === -2)

    await db
      .table('checkin_snapshots')
      .insert({
        managed_account_id: account.id,
        continue_days: Number(checkinPayload.continue_days || 0),
        total_revenue: toNumber(checkinPayload.total_revenue),
        current_day: current ? Number(current.day || 0) : null,
        today_flag: current ? Number(current.flag || 0) : null,
        can_checkin: canCheckin,
        calendar: JSON.stringify(calendar),
        rewards: JSON.stringify(rewards),
        payload: JSON.stringify(checkinPayload),
        updated_at: new Date(),
      })
      .onConflict('managed_account_id')
      .merge({
        continue_days: Number(checkinPayload.continue_days || 0),
        total_revenue: toNumber(checkinPayload.total_revenue),
        current_day: current ? Number(current.day || 0) : null,
        today_flag: current ? Number(current.flag || 0) : null,
        can_checkin: canCheckin,
        calendar: JSON.stringify(calendar),
        rewards: JSON.stringify(rewards),
        payload: JSON.stringify(checkinPayload),
        updated_at: new Date(),
      })

    const snapshot = await AccountSnapshot.findBy('managedAccountId', account.id)
    if (snapshot) {
      snapshot.canCheckin = canCheckin
      await snapshot.save()
    }
  }

  private async requireAssignedAccount(slug: string) {
    const containerCode = env.get('CONTAINER_CODE', inferContainerCode())
    const account = await ManagedAccount.findBy('slug', slug)
    if (!account) {
      throw new AppException('La cuenta no existe.', 404)
    }

    if (account.containerCode !== containerCode) {
      throw new AppException('La cuenta pertenece a otro contenedor.', 409)
    }

    return account
  }
}
