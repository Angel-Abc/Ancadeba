const parsePort = (value?: string | null): number | null => {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn('[editor-ui] Invalid editor server port provided:', value)
    return null
  }

  return parsed
}

const readHostname = (): string => {
  const envHost = import.meta.env.VITE_EDITOR_SERVER_HOST?.trim()
  if (envHost) {
    return envHost
  }

  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname
  }

  return 'localhost'
}

const readProtocol = (): string => {
  const envProtocol = import.meta.env.VITE_EDITOR_SERVER_PROTOCOL?.trim()
  if (envProtocol) {
    return envProtocol.replace(/:$/, '')
  }

  if (typeof window !== 'undefined' && window.location.protocol) {
    return window.location.protocol.replace(/:$/, '')
  }

  return 'http'
}

const buildBaseUrl = (protocol: string, host: string, port: number): string => {
  return `${protocol}://${host}:${port}`
}

export const resolveEditorServerBaseUrl = (): string => {
  const port = parsePort(import.meta.env.VITE_EDITOR_SERVER_PORT) ?? 3001
  const protocol = readProtocol()
  const host = readHostname()
  return buildBaseUrl(protocol, host, port)
}
