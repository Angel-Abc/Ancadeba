import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { GameData, IGameDataLoader } from '@ancadeba/schemas'
import { CORE_MESSAGES } from '../../messages/core'
import { GameEngine } from '../../core/gameEngine'
import type { IGameDataInitializer } from '../../core/gameDataInitializer'
import type { IActionExecutor } from '../../core/actionExecutor'
import { UIReadySignal } from '../../system/uiReadySignal'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import type { IGameStateStorage } from '../../gameState.ts/storage'
import type { GameState } from '../../gameState.ts/types'

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
    const actionExecutor: IActionExecutor = {
      start: vi.fn(),
    }
    let storedState: GameState = {
      activeScene: '',
      title: '',
      flags: {},
      sceneStack: [],
    }
    const gameStateStorage: IGameStateStorage = {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      set state(value: GameState) {
        storedState = value
      },
      get state(): GameState {
        return storedState
      },
    }
    const gameDataInitializer: IGameDataInitializer = {
      initialize: vi.fn((gameData) => {
        const { scene: initialScene, ...initialState } =
          gameData.meta.initialState
        gameStateStorage.state = {
          title: gameData.meta.title,
          activeScene: initialScene,
          flags: {},
          sceneStack: [initialScene],
          ...initialState,
        }
      }),
    }
    let resolveGameData: ((value: GameData) => void) | undefined
    const gameDataPromise = new Promise<GameData>((resolve) => {
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
      gameDataInitializer,
      actionExecutor
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
        styling: [],
        tileSets: [],
        maps: [],
      },
      scenes: [],
      tileSets: [],
      maps: [],
    })
    await Promise.resolve()

    // Assert
    expect(gameStateStorage.state).toEqual({
      title: 'Test Game',
      activeScene: 'intro',
      flags: {},
      sceneStack: ['intro'],
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
    expect(actionExecutor.start).toHaveBeenCalledTimes(1)
  })

  it('waits for game data even if UI is ready first', async () => {
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
    const actionExecutor: IActionExecutor = {
      start: vi.fn(),
    }
    let storedState: GameState = {
      activeScene: '',
      title: '',
      flags: {},
      sceneStack: [],
    }
    const gameStateStorage: IGameStateStorage = {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      set state(value: GameState) {
        storedState = value
      },
      get state(): GameState {
        return storedState
      },
    }
    const gameDataInitializer: IGameDataInitializer = {
      initialize: vi.fn((gameData) => {
        const { scene: initialScene, ...initialState } =
          gameData.meta.initialState
        gameStateStorage.state = {
          title: gameData.meta.title,
          activeScene: initialScene,
          flags: {},
          sceneStack: [initialScene],
          ...initialState,
        }
      }),
    }
    let resolveGameData: ((value: GameData) => void) | undefined
    const gameDataPromise = new Promise<GameData>((resolve) => {
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
      gameDataInitializer,
      actionExecutor
    )

    // Act
    const startPromise = engine.start()
    uiReadySignal.signalReady()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveGameData?.({
      meta: {
        id: 'game-2',
        name: 'Ready First',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        title: 'Ready First',
        description: 'UI ready before data',
        version: '1.0.0',
        initialState: { scene: 'intro' },
        scenes: ['intro'],
        styling: [],
        tileSets: [],
        maps: [],
      },
      scenes: [],
      tileSets: [],
      maps: [],
    })
    await startPromise

    // Assert
    expect(gameStateStorage.state).toEqual({
      title: 'Ready First',
      activeScene: 'intro',
      flags: {},
      sceneStack: ['intro'],
    })
    expect(messageBus.publish).toHaveBeenCalledTimes(1)
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.GAME_ENGINE_STARTED,
      undefined
    )
    expect(actionExecutor.start).toHaveBeenCalledTimes(1)
  })

  it('waits for game data if UI was ready before start', async () => {
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
    const actionExecutor: IActionExecutor = {
      start: vi.fn(),
    }
    let storedState: GameState = {
      activeScene: '',
      title: '',
      flags: {},
      sceneStack: [],
    }
    const gameStateStorage: IGameStateStorage = {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      set state(value: GameState) {
        storedState = value
      },
      get state(): GameState {
        return storedState
      },
    }
    const gameDataInitializer: IGameDataInitializer = {
      initialize: vi.fn((gameData) => {
        const { scene: initialScene, ...initialState } =
          gameData.meta.initialState
        gameStateStorage.state = {
          title: gameData.meta.title,
          activeScene: initialScene,
          flags: {},
          sceneStack: [initialScene],
          ...initialState,
        }
      }),
    }
    let resolveGameData: ((value: GameData) => void) | undefined
    const gameDataPromise = new Promise<GameData>((resolve) => {
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
      gameDataInitializer,
      actionExecutor
    )

    // Act
    uiReadySignal.signalReady()
    const startPromise = engine.start()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveGameData?.({
      meta: {
        id: 'game-3',
        name: 'Already Ready',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        title: 'Already Ready',
        description: 'UI ready before start',
        version: '1.0.0',
        initialState: { scene: 'intro' },
        scenes: ['intro'],
        styling: [],
        tileSets: [],
        maps: [],
      },
      scenes: [],
      tileSets: [],
      maps: [],
    })
    await startPromise

    // Assert
    expect(gameStateStorage.state).toEqual({
      title: 'Already Ready',
      activeScene: 'intro',
      flags: {},
      sceneStack: ['intro'],
    })
    expect(messageBus.publish).toHaveBeenCalledTimes(1)
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.GAME_ENGINE_STARTED,
      undefined
    )
    expect(actionExecutor.start).toHaveBeenCalledTimes(1)
  })
})
