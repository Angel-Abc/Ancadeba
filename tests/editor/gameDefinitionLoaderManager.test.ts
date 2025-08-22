import { describe, it, expect, vi, Mock } from 'vitest'

vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { GameDefinitionLoaderManager } from '../../packages/editor/managers/gameDefinitionLoaderManager'
import { INITIALIZED } from '../../packages/editor/messages/editor'
import type { ILogger } from '@utils/logger'
import type { IMessageBus } from '@utils/messageBus'
import type { IGameDefinitionProvider } from '../../packages/editor/providers/gameDefinitionProvider'

// simple mock provider
class MockGameDefinitionProvider implements IGameDefinitionProvider {
  public get Items() { return [] }
  public setRoot = vi.fn()
}

describe('GameDefinitionLoaderManager', () => {
  it('loads from provided data url', async () => {
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const provider = new MockGameDefinitionProvider()

    const listeners: Record<string, (msg: unknown) => unknown> = {}
    const messageBus: IMessageBus = {
      postMessage: vi.fn(),
      registerMessageListener: vi.fn((msg, handler) => {
        listeners[msg] = handler
        return () => delete listeners[msg]
      }),
      registerNotificationMessage: vi.fn(),
      unregisterNotificationMessage: vi.fn(),
      disableEmptyQueueAfterPost: vi.fn(),
      enableEmptyQueueAfterPost: vi.fn(),
      shutDown: vi.fn()
    } as unknown as IMessageBus

    ;(loadJsonResource as unknown as Mock).mockResolvedValue({})

    const manager = new GameDefinitionLoaderManager(logger, messageBus, provider, '/base')
    manager.initialize()

    await (listeners[INITIALIZED] as (msg: unknown) => Promise<void>)({ message: INITIALIZED, payload: null })

    expect(loadJsonResource).toHaveBeenCalledWith('/base/index.json', expect.anything(), logger)
  })
})
