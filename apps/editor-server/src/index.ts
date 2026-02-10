import type { Server } from 'node:http'
import path from 'path'
import dotenv from 'dotenv'
import express, { type Express } from 'express'

type Logger = Pick<Console, 'log'>

export type EditorServerOptions = {
  port?: number | string
  resourcesDir?: string
  envPath?: string
  logger?: Logger
}

export function createApp(resourcesDir: string | undefined): Express {
  const app = express()

  app.get('/', (_req, res) => {
    res.send(`Game resources are located at: ${resourcesDir}`)
  })

  return app
}

export function startServer(
  app: Express,
  port: number | string,
  logger: Logger = console,
): Server {
  const server = app.listen(port, () => {
    const address = server.address()
    const listeningPort =
      typeof address === 'object' && address ? address.port : port

    logger.log(`Editor server listening on port ${listeningPort}`)
  })

  return server
}

export function bootstrapEditorServer(options: EditorServerOptions = {}): Server {
  const envPath = options.envPath ?? path.resolve(__dirname, '../../../.env')

  // Load environment variables from the root of the monorepo
  dotenv.config({ path: envPath })

  const logger = options.logger ?? console
  const resourcesDir = options.resourcesDir ?? process.env.VITE_GAME_RESOURCES_DIR
  const port = options.port ?? process.env.PORT ?? 3000

  logger.log(`Resources Directory: ${resourcesDir}`)

  const app = createApp(resourcesDir)
  return startServer(app, port, logger)
}

if (
  typeof require !== 'undefined' &&
  typeof module !== 'undefined' &&
  require.main === module
) {
  bootstrapEditorServer()
}
