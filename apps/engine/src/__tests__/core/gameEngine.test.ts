import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IGameDataLoader } from '@ancadeba/schemas'
import { CORE_MESSAGES } from '../../messages/core'
import { GameEngine } from '../../core/gameEngine'
import { UIReadySignal } from '../../system/uiReadySignal'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import type { IGameStateStorage } from '../../gameState.ts/storage'

describe('core/gameEngine', () => {
  it('initializes game state before publishing the start message', async () => {
    // Arrange
    const logger: ILogger = {
      debug: vi.fn(() => ''),
      info: vi.fn(() => ''),
      warn: vi.fn(() => ''),
      error: vi.fn(() => ''),
      fatal: vi.fn(() => {
        throw new Error('fatal')
      }),
    }
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
      subscribeRaw: vi.fn(() => () => undefined),
    }
    const uiReadySignal = new UIReadySignal()
    let storedState: Record<string, unknown> = {}
    const gameStateStorage: IGameStateStorage = {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      set state(value: Record<string, unknown>) {
        storedState = value
      },
      get state(): Record<string, unknown> {
        return storedState
      },
    }
    let resolveGameData: ((value: {
      meta: {
        id: string
        name: string
        createdAt: string
        updatedAt: string
        title: string
        description: string
        version: string
        initialState: { scene: string }
        scenes: string[]
      }
      scenes: []
    }) => void) | undefined
    const gameDataPromise = new Promise<{
      meta: {
        id: string
        name: string
        createdAt: string
        updatedAt: string
        title: string
        description: string
        version: string
        initialState: { scene: string }
        scenes: string[]
      }
      scenes: []
    }>((resolve) => {
      resolveGameData = resolve
    })
    const gameDataLoader: IGameDataLoader = {
      loadGameData: vi.fn(() => gameDataPromise),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameStateStorage
    )

    // Act
    const startPromise = engine.start()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveGameData?.({
      meta: {
        id: 'game-1',
        name: 'Test Game',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        title: 'Test Game',
        description: 'Test Description',
        version: '1.0.0',
        initialState: { scene: 'intro' },
        scenes: ['intro'],
      },
      scenes: [],
    })
    await Promise.resolve()

    // Assert
    expect(gameStateStorage.state).toEqual({
      title: 'Test Game',
      scene: 'intro',
    })
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    uiReadySignal.signalReady()
    await startPromise

    // Assert
    expect(messageBus.publish).toHaveBeenCalledTimes(1)
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.GAME_ENGINE_STARTED,
      undefined
    )
  })
})
