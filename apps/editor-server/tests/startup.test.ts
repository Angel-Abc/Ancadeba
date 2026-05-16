import { once } from 'node:events'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bootstrapEditorServer,
  createApp,
  startServer,
} from '../src/index'

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

describe('editor server startup', () => {
  let server: Server | undefined
  let originalEditorServerPort: string | undefined

  beforeEach(() => {
    originalEditorServerPort = process.env.EDITOR_SERVER_PORT
  })

  afterEach(async () => {
    if (server) {
      await closeServer(server)
      server = undefined
    }

    if (originalEditorServerPort === undefined) {
      delete process.env.EDITOR_SERVER_PORT
    } else {
      process.env.EDITOR_SERVER_PORT = originalEditorServerPort
    }
  })

  it('serves the configured resources directory at the root route', async () => {
    // Arrange
    const app = createApp('sample/resources')
    server = startServer(app, 0)
    await once(server, 'listening')
    const address = server.address() as AddressInfo

    // Act
    const response = await fetch(`http://127.0.0.1:${address.port}/`)
    const body = await response.text()

    // Assert
    expect(response.status).toBe(200)
    expect(body).toBe('Game resources are located at: sample/resources')
  })

  it('bootstraps with explicit options and logs the resources directory', async () => {
    // Arrange
    const logger = {
      log: vi.fn(),
    }
    server = bootstrapEditorServer({
      logger,
      resourcesDir: 'fixtures/resources',
      port: 0,
    })
    await once(server, 'listening')
    const address = server.address() as AddressInfo

    // Act
    const response = await fetch(`http://127.0.0.1:${address.port}/`)
    const body = await response.text()

    // Assert
    expect(body).toBe('Game resources are located at: fixtures/resources')
    expect(logger.log).toHaveBeenCalledWith(
      'Resources Directory: fixtures/resources',
    )
  })

  it('uses the configured editor server port environment variable', async () => {
    // Arrange
    originalEditorServerPort = process.env.EDITOR_SERVER_PORT
    process.env.EDITOR_SERVER_PORT = '0'
    const logger = {
      log: vi.fn(),
    }

    // Act
    server = bootstrapEditorServer({
      envPath: 'missing.env',
      logger,
      resourcesDir: 'fixtures/resources',
    })
    await once(server, 'listening')
    const address = server.address() as AddressInfo

    // Assert
    expect(address.port).toBeGreaterThan(0)
  })
})
