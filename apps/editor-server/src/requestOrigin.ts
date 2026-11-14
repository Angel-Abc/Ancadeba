import { isIP } from 'node:net'

function hostName(url: string): string | undefined {
  try {
    const parsed = new URL(url)

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    )
      return undefined

    return parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  } catch {
    return undefined
  }
}

function localHostName(name: string): boolean {
  return (
    name === 'localhost' ||
    name.endsWith('.localhost') ||
    (isIP(name) === 4 && name.startsWith('127.')) ||
    name === '::1' ||
    /^::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}$/.test(name)
  )
}

/**
 * IP literals are valid server addresses, but are not automatically trusted browser origins.
 * Browser origins must be local, explicitly configured, or use the addressed server's hostname.
 */
export function isTrustedRequest(
  headers: { host?: string | undefined; origin?: string | undefined },
  configuredHost: string,
): boolean {
  if (headers.host === undefined) return false

  const addressed = hostName(`http://${headers.host}`)

  const configured = hostName(
    `http://${isIP(configuredHost) === 6 ? `[${configuredHost}]` : configuredHost}`,
  )

  if (
    addressed === undefined ||
    !(isIP(addressed) !== 0 || localHostName(addressed) || addressed === configured)
  )
    return false

  if (headers.origin === undefined) return true
  const origin = hostName(headers.origin)

  return (
    origin !== undefined && (localHostName(origin) || origin === configured || origin === addressed)
  )
}
