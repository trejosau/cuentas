import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health.index': { paramsTuple?: []; params?: {} }
    'internal_accounts.store': { paramsTuple?: []; params?: {} }
    'internal_accounts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'internal_accounts.sync': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'internal_accounts.checkin': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'internal_accounts.receive': { paramsTuple: [ParamValue,ParamValue]; params: {'slug': ParamValue,'projectId': ParamValue} }
  }
  GET: {
    'health.index': { paramsTuple?: []; params?: {} }
    'internal_accounts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  HEAD: {
    'health.index': { paramsTuple?: []; params?: {} }
    'internal_accounts.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  POST: {
    'internal_accounts.store': { paramsTuple?: []; params?: {} }
    'internal_accounts.sync': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'internal_accounts.checkin': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'internal_accounts.receive': { paramsTuple: [ParamValue,ParamValue]; params: {'slug': ParamValue,'projectId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}