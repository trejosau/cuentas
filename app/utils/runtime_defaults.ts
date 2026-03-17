const railwayPublicDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim()
const railwayServiceName = process.env.RAILWAY_SERVICE_NAME?.trim()

export function inferAppName() {
  return process.env.APP_NAME || railwayServiceName || 'cuentas'
}

export function inferContainerCode() {
  if (process.env.CONTAINER_CODE) {
    return process.env.CONTAINER_CODE
  }

  if (railwayPublicDomain) {
    return railwayPublicDomain.split('.')[0] || 'cuentas'
  }

  return railwayServiceName || 'cuentas'
}

export function inferContainerName() {
  return process.env.CONTAINER_NAME || railwayServiceName || inferContainerCode()
}

export function inferContainerBaseUrl() {
  if (process.env.CONTAINER_BASE_URL) {
    return process.env.CONTAINER_BASE_URL
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL
  }

  if (railwayPublicDomain) {
    return `https://${railwayPublicDomain}`
  }

  const host = process.env.HOST || '0.0.0.0'
  const port = process.env.PORT || '3334'
  return `http://${host}:${port}`
}

export function inferAppUrl() {
  return process.env.APP_URL || inferContainerBaseUrl()
}

export function inferAppKey() {
  return process.env.APP_KEY || process.env.INTERNAL_API_TOKEN || 'hmc-cuentas-fallback-app-key'
}
