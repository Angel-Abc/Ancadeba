import { parseArgs } from 'node:util'
import { adapterConfigFromValues, adapterOptions, gameUsage, type AdapterConfig } from './config.js'

export interface HttpAdapterConfig extends AdapterConfig {
  port: number
  allowedOrigins: string[]
}

export const httpUsage =
  'Usage: node apps/editor-mcp/dist/httpMain.js --editor-server-url http://127.0.0.1:3000 [--game basic] [--port 3101] [--allowed-origin http://localhost:8081] [--timeout-ms 10000]\n' +
  gameUsage +
  '\nServes Streamable HTTP at http://127.0.0.1:3101/mcp. Repeat --allowed-origin for additional browser origins. Start the editor server separately.'

export function parseHttpAdapterConfig(args: string[]): HttpAdapterConfig {
  const { values } = parseArgs({
    args,
    strict: true,
    allowPositionals: false,
    options: {
      ...adapterOptions,
      port: { type: 'string', default: '3101' },
      'allowed-origin': { type: 'string', multiple: true, default: [] },
    },
  })

  const adapter = adapterConfigFromValues(values)
  const port = Number(values.port)

  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('Port must be an integer between 1 and 65535')

  const allowedOrigins = values['allowed-origin'].map((value) => {
    const url = new URL(value)

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw new Error('Allowed origin must be an HTTP(S) origin without credentials or a path')

    return url.origin
  })

  return { ...adapter, port, allowedOrigins: [...new Set(allowedOrigins)] }
}
