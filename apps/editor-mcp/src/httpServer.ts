import { randomUUID } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import {
  NodeStreamableHTTPServerTransport,
  localhostHostValidation,
} from '@modelcontextprotocol/node'
import type { McpServer } from '@modelcontextprotocol/server'
import type { HttpAdapterConfig } from './httpConfig.js'
import { maxMcpMessageBytes } from './operationSupport.js'

const maxSessions = 32
const sessionIdleMs = 30 * 60 * 1000

interface HttpSession {
  mcp: McpServer
  transport: NodeStreamableHTTPServerTransport
  shutdown: AbortController
  activeRequests: number
  lastUsed: number
}

function httpError(response: ServerResponse, status: number, message: string) {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32000, message } }))
}

/** Transport and session lifecycle only; all tools come from the injected factory. */
export function createHttpAdapter(
  config: Pick<HttpAdapterConfig, 'allowedOrigins'>,
  createMcp: (signal: AbortSignal) => McpServer,
  reportError: (error: unknown) => void = () => {},
) {
  const sessions = new Set<HttpSession>()
  const byId = new Map<string, HttpSession>()
  const validateHost = localhostHostValidation()
  let closing = false
  let closed: Promise<void> | undefined

  async function dispose(session: HttpSession) {
    sessions.delete(session)

    if (session.transport.sessionId) byId.delete(session.transport.sessionId)
    session.shutdown.abort()
    await session.mcp.close()
  }

  async function createSession() {
    const shutdown = new AbortController()
    const mcp = createMcp(shutdown.signal)

    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: randomUUID,
      enableJsonResponse: true,
      maxRequestBodySize: maxMcpMessageBytes,
      onsessioninitialized: (id) => {
        byId.set(id, session)
      },
    })

    const session: HttpSession = {
      mcp,
      transport,
      shutdown,
      activeRequests: 0,
      lastUsed: Date.now(),
    }

    sessions.add(session)

    try {
      await mcp.connect(transport)
    } catch (error) {
      await dispose(session)
      throw error
    }

    const onclose = transport.onclose
    transport.onclose = () => {
      sessions.delete(session)

      if (transport.sessionId) byId.delete(transport.sessionId)
      shutdown.abort()
      onclose?.()
    }

    return session
  }

  async function handle(request: IncomingMessage, response: ServerResponse) {
    if (!validateHost(request, response)) return
    response.setHeader('Vary', 'Origin')
    const origin = request.headers.origin

    if (origin && !config.allowedOrigins.includes(origin)) {
      httpError(response, 403, 'Origin is not allowed')

      return
    }

    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Access-Control-Expose-Headers', 'MCP-Session-Id, MCP-Protocol-Version')
    }

    if (request.url !== '/mcp') {
      httpError(response, 404, 'Use the /mcp endpoint')

      return
    }

    if (closing) {
      httpError(response, 503, 'MCP server is shutting down')

      return
    }

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Accept, Content-Type, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID',
      })
      response.end()

      return
    }

    if (!['GET', 'POST', 'DELETE'].includes(request.method ?? '')) {
      response.setHeader('Allow', 'GET, POST, DELETE, OPTIONS')
      httpError(response, 405, 'Method not allowed')

      return
    }

    const id = request.headers['mcp-session-id']
    let session: HttpSession | undefined

    if (id !== undefined) {
      session = typeof id === 'string' ? byId.get(id) : undefined

      if (!session) {
        httpError(response, 404, 'Session not found; initialize a new connection')

        return
      }
    } else {
      if (request.method !== 'POST') {
        httpError(response, 400, 'Initialize a connection before using this endpoint')

        return
      }

      if (sessions.size >= maxSessions) {
        httpError(response, 503, 'Too many MCP sessions; close an existing connection')

        return
      }

      session = await createSession()
    }

    session.activeRequests++
    session.lastUsed = Date.now()

    try {
      await session.transport.handleRequest(request, response)
    } finally {
      session.activeRequests--
      session.lastUsed = Date.now()

      // Invalid initial requests must not leave a server or API client alive.
      if (!session.transport.sessionId) await dispose(session)
    }
  }

  const server = createServer((request, response) => {
    void handle(request, response).catch((error: unknown) => {
      reportError(error)

      if (!response.headersSent) httpError(response, 500, 'Internal MCP transport error')
      else response.destroy()
    })
  })

  const expiry = setInterval(() => {
    for (const session of sessions) {
      if (session.activeRequests === 0 && Date.now() - session.lastUsed >= sessionIdleMs)
        void dispose(session).catch(reportError)
    }
  }, 60_000)

  expiry.unref()

  function close(): Promise<void> {
    if (closed) return closed
    closing = true
    clearInterval(expiry)
    closed = (async () => {
      const stopped = server.listening
        ? new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          )
        : Promise.resolve()

      try {
        await Promise.all([...sessions].map(dispose))
      } finally {
        server.closeAllConnections()
        await stopped
      }
    })()

    return closed
  }

  return { server, close }
}
