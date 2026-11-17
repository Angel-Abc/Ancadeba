import { once } from 'node:events'
import { createAdapterServer } from './adapter.js'
import { parseHttpAdapterConfig, httpUsage } from './httpConfig.js'
import { createHttpAdapter } from './httpServer.js'

let adapter: ReturnType<typeof createHttpAdapter> | undefined

try {
  if (process.argv.slice(2).length === 1 && process.argv[2] === '--help') {
    console.error(httpUsage)
  } else {
    const config = parseHttpAdapterConfig(process.argv.slice(2))
    adapter = createHttpAdapter(
      config,
      (signal) => createAdapterServer(config, fetch, signal),
      (error) => console.error('MCP HTTP transport error:', error),
    )
    const active = adapter

    const close = () => {
      void active.close().catch((error: unknown) => {
        console.error('Could not close MCP HTTP adapter:', error)
        process.exitCode = 1
      })
    }

    process.once('SIGINT', close)
    process.once('SIGTERM', close)
    active.server.listen(config.port, '127.0.0.1')
    await once(active.server, 'listening')
    console.error(`Ancadeba MCP listening at http://127.0.0.1:${config.port}/mcp`)
  }
} catch (error) {
  await adapter?.close()
  console.error(error instanceof Error ? error.message : 'Could not start MCP HTTP adapter')
  console.error(httpUsage)
  process.exitCode = 1
}
