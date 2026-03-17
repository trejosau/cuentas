/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'health.index': {
    methods: ["GET","HEAD"],
    pattern: '/health',
    tokens: [{"old":"/health","type":0,"val":"health","end":""}],
    types: placeholder as Registry['health.index']['types'],
  },
  'internal_accounts.store': {
    methods: ["POST"],
    pattern: '/internal/accounts',
    tokens: [{"old":"/internal/accounts","type":0,"val":"internal","end":""},{"old":"/internal/accounts","type":0,"val":"accounts","end":""}],
    types: placeholder as Registry['internal_accounts.store']['types'],
  },
  'internal_accounts.show': {
    methods: ["GET","HEAD"],
    pattern: '/internal/accounts/:slug',
    tokens: [{"old":"/internal/accounts/:slug","type":0,"val":"internal","end":""},{"old":"/internal/accounts/:slug","type":0,"val":"accounts","end":""},{"old":"/internal/accounts/:slug","type":1,"val":"slug","end":""}],
    types: placeholder as Registry['internal_accounts.show']['types'],
  },
  'internal_accounts.sync': {
    methods: ["POST"],
    pattern: '/internal/accounts/:slug/sync',
    tokens: [{"old":"/internal/accounts/:slug/sync","type":0,"val":"internal","end":""},{"old":"/internal/accounts/:slug/sync","type":0,"val":"accounts","end":""},{"old":"/internal/accounts/:slug/sync","type":1,"val":"slug","end":""},{"old":"/internal/accounts/:slug/sync","type":0,"val":"sync","end":""}],
    types: placeholder as Registry['internal_accounts.sync']['types'],
  },
  'internal_accounts.checkin': {
    methods: ["POST"],
    pattern: '/internal/accounts/:slug/checkin',
    tokens: [{"old":"/internal/accounts/:slug/checkin","type":0,"val":"internal","end":""},{"old":"/internal/accounts/:slug/checkin","type":0,"val":"accounts","end":""},{"old":"/internal/accounts/:slug/checkin","type":1,"val":"slug","end":""},{"old":"/internal/accounts/:slug/checkin","type":0,"val":"checkin","end":""}],
    types: placeholder as Registry['internal_accounts.checkin']['types'],
  },
  'internal_accounts.receive': {
    methods: ["POST"],
    pattern: '/internal/accounts/:slug/projects/:projectId/receive',
    tokens: [{"old":"/internal/accounts/:slug/projects/:projectId/receive","type":0,"val":"internal","end":""},{"old":"/internal/accounts/:slug/projects/:projectId/receive","type":0,"val":"accounts","end":""},{"old":"/internal/accounts/:slug/projects/:projectId/receive","type":1,"val":"slug","end":""},{"old":"/internal/accounts/:slug/projects/:projectId/receive","type":0,"val":"projects","end":""},{"old":"/internal/accounts/:slug/projects/:projectId/receive","type":1,"val":"projectId","end":""},{"old":"/internal/accounts/:slug/projects/:projectId/receive","type":0,"val":"receive","end":""}],
    types: placeholder as Registry['internal_accounts.receive']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
