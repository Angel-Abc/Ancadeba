import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { GameData, IGameDataLoader } from '@ancadeba/schemas'
import { CORE_MESSAGES } from '../../messages/core'
import { GameEngine } from '../../core/gameEngine'
import type { IGameDataInitializer } from '../../core/gameDataInitializer'
import type { ILifecycleCoordinator } from '../../core/lifecycleCoordinator'
import { UIReadySignal } from '../../system/uiReadySignal'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import type {
  IGameStateReader,
  IGameStateMutator,
} from '../../gameState.ts/storage'
import type { GameState } from '../../gameState.ts/types'

describe('core/gameEngine', () => {
  const baseTimestamp = '2026-01-10T00:00:00Z'

  const createLanguageMap = (
    languages: GameData['meta']['languages']
  ): GameData['languages'] =>
    new Map(
      Object.entries(languages).map(([key, value]) => [key, value])
    )

  const createGameData = (
    metaOverrides: Partial<GameData['meta']> = {}
  ): GameData => {
    const meta: GameData['meta'] = {
      id: 'game-1',
      createdAt: baseTimestamp,
      updatedAt: baseTimestamp,
      title: 'Test Game',
      description: 'Test Description',
      version: '1.0.0',
      initialState: { scene: 'intro' },
      scenes: ['intro'],
      styling: [],
      tileSets: [],
      maps: [],
      items: [],
      appearanceCategories: [],
      appearances: [],
      virtualKeys: 'virtual-keys',
      virtualInputs: 'virtual-inputs',
      languages: {
        en: { name: 'English', files: ['system.json'] },
      },
      defaultSettings: { language: 'en', volume: 0.5 },
      ...metaOverrides,
    }

    return {
      meta,
      languages: createLanguageMap(meta.languages),
      scenes: [],
      tileSets: [],
      maps: [],
      items: [],
      appearanceCategories: [],
      appearances: [],
      virtualKeys: {
        id: 'virtual-keys',
        createdAt: baseTimestamp,
        updatedAt: baseTimestamp,
        mappings: [],
      },
      virtualInputs: {
        id: 'virtual-inputs',
        createdAt: baseTimestamp,
        updatedAt: baseTimestamp,
        mappings: [],
      },
    }
  }

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
    const lifecycleCoordinator: ILifecycleCoordinator = {
      start: vi.fn(),
      stop: vi.fn(),
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
      initialize: vi.fn(async (gameData) => {
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
      loadLanguageData: vi.fn(),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameDataInitializer,
      lifecycleCoordinator
    )

    // Act
    const startPromise = engine.start()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveGameData?.(
      createGameData({
        id: 'game-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        title: 'Test Game',
        description: 'Test Description',
      })
    )
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
    expect(lifecycleCoordinator.start).toHaveBeenCalledTimes(1)
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
    const lifecycleCoordinator: ILifecycleCoordinator = {
      start: vi.fn(),
      stop: vi.fn(),
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
      initialize: vi.fn(async (gameData) => {
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
      loadLanguageData: vi.fn(),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameDataInitializer,
      lifecycleCoordinator
    )

    // Act
    const startPromise = engine.start()
    uiReadySignal.signalReady()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveGameData?.(
      createGameData({
        id: 'game-2',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        title: 'Ready First',
        description: 'UI ready before data',
      })
    )
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
    expect(lifecycleCoordinator.start).toHaveBeenCalledTimes(1)
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
    const lifecycleCoordinator: ILifecycleCoordinator = {
      start: vi.fn(),
      stop: vi.fn(),
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
      initialize: vi.fn(async (gameData) => {
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
      loadLanguageData: vi.fn(),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameDataInitializer,
      lifecycleCoordinator
    )

    // Act
    uiReadySignal.signalReady()
    const startPromise = engine.start()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()

    // Act
    resolveGameData?.(
      createGameData({
        id: 'game-3',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        title: 'Already Ready',
        description: 'UI ready before start',
      })
    )
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
    expect(lifecycleCoordinator.start).toHaveBeenCalledTimes(1)
  })

  it('calls lifecycleCoordinator.stop on stop', () => {
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
    const lifecycleCoordinator: ILifecycleCoordinator = {
      start: vi.fn(),
      stop: vi.fn(),
    }
    const gameDataInitializer: IGameDataInitializer = {
      initialize: vi.fn(async () => undefined),
    }
    const gameDataLoader: IGameDataLoader = {
      loadGameData: vi.fn(),
      loadLanguageData: vi.fn(),
    }
    const engine = new GameEngine(
      logger,
      messageBus,
      uiReadySignal,
      gameDataLoader,
      gameDataInitializer,
      lifecycleCoordinator
    )

    // Act
    engine.stop()

    // Assert
    expect(lifecycleCoordinator.stop).toHaveBeenCalledTimes(1)
  })
})
