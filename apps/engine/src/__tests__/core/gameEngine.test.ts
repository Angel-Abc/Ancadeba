import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { GameData, IGameDataLoader } from '@ancadeba/schemas'
import { CORE_MESSAGES } from '../../messages/core'
import { GameEngine } from '../../core/gameEngine'
import type { IGameDataInitializer } from '../../core/gameDataInitializer'
import type { IActionExecutor } from '../../core/actionExecutor'
import { UIReadySignal } from '../../system/uiReadySignal'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import type {
  IGameStateReader,
  IGameStateMutator,
} from '../../gameState.ts/storage'
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
      activeSceneId: '',
      activeMapId: null,
      title: '',
      flags: {},
      sceneStack: [],
    }
    const gameStateStorage: IGameStateReader & IGameStateMutator = {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      set state(value: GameState) {
        storedState = value
      },
      get state(): GameState {
        return storedState
      },
      get activeSceneId(): string {
        return storedState.activeSceneId
      },
      get activeMapId(): string | null {
        return storedState.activeMapId
      },
    }
    const gameDataInitializer: IGameDataInitializer = {
      initialize: vi.fn((gameData) => {
        const { scene: initialScene, ...initialState } =
          gameData.meta.initialState
        gameStateStorage.state = {
          title: gameData.meta.title,
          activeSceneId: initialScene,
          activeMapId: gameData.meta.initialState.map || null,
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
    const keyboardListener = {
      start: vi.fn(),
      listen: vi.fn(() => () => {}),
    }
    const keyboardInputService = {
      start: vi.fn(),
      stop: vi.fn(),
    }
    const virtualInputService = {
      start: vi.fn(),
      stop: vi.fn(),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameDataInitializer,
      actionExecutor,
      keyboardListener,
      keyboardInputService,
      virtualInputService
    )

    // Act
    const startPromise = engine.start()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveGameData?.({
      meta: {
        id: 'game-1',
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
      virtualKeys: {
        id: 'virtual-keys',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
      virtualInputs: {
        id: 'virtual-inputs',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
    })
    await Promise.resolve()

    // Assert
    expect(gameStateStorage.state).toEqual({
      title: 'Test Game',
      activeSceneId: 'intro',
      activeMapId: null,
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
      activeSceneId: '',
      activeMapId: null,
      title: '',
      flags: {},
      sceneStack: [],
    }
    const gameStateStorage: IGameStateReader & IGameStateMutator = {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      set state(value: GameState) {
        storedState = value
      },
      get state(): GameState {
        return storedState
      },
      get activeSceneId(): string {
        return storedState.activeSceneId
      },
      get activeMapId(): string | null {
        return storedState.activeMapId
      },
    }
    const gameDataInitializer: IGameDataInitializer = {
      initialize: vi.fn((gameData) => {
        const { scene: initialScene, ...initialState } =
          gameData.meta.initialState
        gameStateStorage.state = {
          title: gameData.meta.title,
          activeSceneId: initialScene,
          activeMapId: gameData.meta.initialState.map || null,
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
    const keyboardListener = {
      start: vi.fn(),
      listen: vi.fn(() => () => {}),
    }
    const keyboardInputService = {
      start: vi.fn(),
      stop: vi.fn(),
    }
    const virtualInputService = {
      start: vi.fn(),
      stop: vi.fn(),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameDataInitializer,
      actionExecutor,
      keyboardListener,
      keyboardInputService,
      virtualInputService
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
      virtualKeys: {
        id: 'virtual-keys',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
      virtualInputs: {
        id: 'virtual-inputs',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
    })
    await startPromise

    // Assert
    expect(gameStateStorage.state).toEqual({
      title: 'Ready First',
      activeSceneId: 'intro',
      activeMapId: null,
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
      activeSceneId: '',
      activeMapId: null,
      title: '',
      flags: {},
      sceneStack: [],
    }
    const gameStateStorage: IGameStateReader & IGameStateMutator = {
      update: vi.fn((value) => {
        storedState = { ...storedState, ...value }
      }),
      set state(value: GameState) {
        storedState = value
      },
      get state(): GameState {
        return storedState
      },
      get activeSceneId(): string {
        return storedState.activeSceneId
      },
      get activeMapId(): string | null {
        return storedState.activeMapId
      },
    }
    const gameDataInitializer: IGameDataInitializer = {
      initialize: vi.fn((gameData) => {
        const { scene: initialScene, ...initialState } =
          gameData.meta.initialState
        gameStateStorage.state = {
          title: gameData.meta.title,
          activeSceneId: initialScene,
          activeMapId: gameData.meta.initialState.map || null,
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
    const keyboardListener = {
      start: vi.fn(),
      listen: vi.fn(() => () => {}),
    }
    const keyboardInputService = {
      start: vi.fn(),
      stop: vi.fn(),
    }
    const virtualInputService = {
      start: vi.fn(),
      stop: vi.fn(),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameDataInitializer,
      actionExecutor,
      keyboardListener,
      keyboardInputService,
      virtualInputService
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
      virtualKeys: {
        id: 'virtual-keys',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
      virtualInputs: {
        id: 'virtual-inputs',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
        mappings: [],
      },
    })
    await startPromise

    // Assert
    expect(gameStateStorage.state).toEqual({
      title: 'Already Ready',
      activeSceneId: 'intro',
      activeMapId: null,
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
