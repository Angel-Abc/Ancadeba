import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

vi.mock('@utils/runScript', () => ({ runScript: vi.fn() }))

import { runScript } from '@utils/runScript'
import { ScriptService } from '../../engine/services/scriptService'
import type { IGameDataProvider, GameData, GameContext } from '@providers/gameDataProvider'
import type { IMessageBus } from '@utils/messageBus'
import type { ILogger } from '@utils/logger'

const createGameDataProvider = (): IGameDataProvider => ({
  get Game() { return { id: 'game' } as unknown as GameData },
  get Context() { return { id: 'context' } as unknown as GameContext },
  initialize: vi.fn()
})

const createMessageBus = (): IMessageBus => ({
  postMessage: vi.fn(),
  registerMessageListener: vi.fn(),
  registerNotificationMessage: vi.fn(),
  unregisterNotificationMessage: vi.fn(),
  disableEmptyQueueAfterPost: vi.fn(),
  enableEmptyQueueAfterPost: vi.fn(),
  shutDown: vi.fn()
})

describe('ScriptService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('logs errors at error level when script execution fails', () => {
    ;(runScript as unknown as Mock).mockImplementation(() => { throw new Error('boom') })
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const service = new ScriptService(createGameDataProvider(), logger, createMessageBus())
    const data = { value: 42 }
    expect(() => service.runScript('bad script', data)).toThrow('boom')
    expect(logger.error).toHaveBeenNthCalledWith(1, 'ScriptService', 'Failed script: {0}', 'bad script')
    expect(logger.error).toHaveBeenNthCalledWith(2, 'ScriptService', 'context: {0}', {
      game: { id: 'game' },
      data: { id: 'context' },
      postMessage: expect.any(Function)
    })
    expect(logger.error).toHaveBeenNthCalledWith(3, 'ScriptService', 'data: {0}', data)
  })
})

