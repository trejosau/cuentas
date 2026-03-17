/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'health.index': {
    methods: ["GET","HEAD"]
    pattern: '/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/health_controller').default['index']>>>
    }
  }
  'internal_accounts.store': {
    methods: ["POST"]
    pattern: '/internal/accounts'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/register_account').registerAccountValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/register_account').registerAccountValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'internal_accounts.show': {
    methods: ["GET","HEAD"]
    pattern: '/internal/accounts/:slug'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['show']>>>
    }
  }
  'internal_accounts.sync': {
    methods: ["POST"]
    pattern: '/internal/accounts/:slug/sync'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['sync']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['sync']>>>
    }
  }
  'internal_accounts.checkin': {
    methods: ["POST"]
    pattern: '/internal/accounts/:slug/checkin'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { slug: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['checkin']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['checkin']>>>
    }
  }
  'internal_accounts.receive': {
    methods: ["POST"]
    pattern: '/internal/accounts/:slug/projects/:projectId/receive'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { slug: ParamValue; projectId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['receive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/internal_accounts_controller').default['receive']>>>
    }
  }
}
