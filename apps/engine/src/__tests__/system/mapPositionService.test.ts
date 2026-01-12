import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IConditionResolver } from '../../core/conditionResolver'
import type {
  IGameStateMutator,
  IGameStateReader,
} from '../../gameState.ts/storage'
import type { GameState } from '../../gameState.ts/types'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { CORE_MESSAGES } from '../../messages/core'
import { UI_MESSAGES } from '../../messages/ui'
import { MapPositionService } from '../../system/mapPositionService'

const createLogger = (): ILogger => ({
  debug: vi.fn().mockReturnValue(''),
  info: vi.fn().mockReturnValue(''),
  warn: vi.fn().mockReturnValue(''),
  error: vi.fn().mockReturnValue(''),
  fatal: vi.fn(() => {
    throw new Error('fatal')
  }),
})

const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
  title: '',
  activeSceneId: '',
  activeMapId: null,
  flags: {},
  sceneStack: [],
  ...overrides,
})

const createGameStateReader = (state: GameState): IGameStateReader => ({
  get state() {
    return state
  },
  get activeSceneId() {
    return state.activeSceneId
  },
  get activeMapId() {
    return state.activeMapId
  },
})

const createGameStateMutator = (): IGameStateMutator => ({
  update: vi.fn(),
  set state(_value: GameState) {},
})

describe('system/mapPositionService', () => {
  it('start subscribes to VIRTUAL_INPUT_PRESSED', () => {
    // Arrange
    const mockSubscribe = vi.fn().mockReturnValue(() => {})
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 1, y: 1 } })
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      createGameStateMutator()
    )

    // Act
    service.start()

    // Assert
    expect(mockSubscribe).toHaveBeenCalledTimes(1)
    expect(mockSubscribe).toHaveBeenCalledWith(
      UI_MESSAGES.VIRTUAL_INPUT_PRESSED,
      expect.any(Function)
    )
  })

  it('start subscribes on each call', () => {
    // Arrange
    const mockSubscribe = vi.fn().mockReturnValue(() => {})
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 1, y: 1 } })
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      createGameStateMutator()
    )

    // Act
    service.start()
    service.start()

    // Assert
    expect(mockSubscribe).toHaveBeenCalledTimes(2)
    expect(mockSubscribe).toHaveBeenCalledWith(
      UI_MESSAGES.VIRTUAL_INPUT_PRESSED,
      expect.any(Function)
    )
  })

  it('logs warning when map position is missing', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | null = null
    const mockSubscribe = vi.fn((message, callback) => {
      handler = callback
      return () => {}
    })
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState()
    const logger = createLogger()
    const gameStateMutator = createGameStateMutator()
    const service = new MapPositionService(
      logger,
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      gameStateMutator
    )

    // Act
    service.start()
    handler?.({ virtualInput: 'VI_UP', label: 'Up' })

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/system/mapPositionService',
      'Map position is not defined'
    )
    expect(gameStateMutator.update).not.toHaveBeenCalled()
    expect(messageBus.publish).not.toHaveBeenCalled()
  })

  it('updates map position and publishes when move is allowed', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | null = null
    const mockSubscribe = vi.fn((message, callback) => {
      handler = callback
      return () => {}
    })
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 2, y: 3 } })
    const gameStateMutator = createGameStateMutator()
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      gameStateMutator
    )

    // Act
    service.start()
    handler?.({ virtualInput: 'VI_RIGHT', label: 'Right' })

    // Assert
    expect(gameStateMutator.update).toHaveBeenCalledWith({
      mapPosition: { x: 3, y: 3 },
    })
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.MAP_POSITION_CHANGED,
      { mapPosition: { x: 3, y: 3 } }
    )
  })

  it('updates map position and publishes for upward movement', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | null = null
    const mockSubscribe = vi.fn((message, callback) => {
      handler = callback
      return () => {}
    })
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 3, y: 4 } })
    const gameStateMutator = createGameStateMutator()
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      gameStateMutator
    )

    // Act
    service.start()
    handler?.({ virtualInput: 'VI_UP', label: 'Up' })

    // Assert
    expect(gameStateMutator.update).toHaveBeenCalledWith({
      mapPosition: { x: 3, y: 3 },
    })
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.MAP_POSITION_CHANGED,
      { mapPosition: { x: 3, y: 3 } }
    )
  })

  it('does not update or publish when movement is blocked', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | null = null
    const mockSubscribe = vi.fn((message, callback) => {
      handler = callback
      return () => {}
    })
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(false),
    }
    const state = createGameState({ mapPosition: { x: 2, y: 3 } })
    const gameStateMutator = createGameStateMutator()
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      gameStateMutator
    )

    // Act
    service.start()
    handler?.({ virtualInput: 'VI_LEFT', label: 'Left' })

    // Assert
    expect(gameStateMutator.update).not.toHaveBeenCalled()
    expect(messageBus.publish).not.toHaveBeenCalled()
  })

  it('does not update or publish when map position is missing', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | null = null
    const mockSubscribe = vi.fn((message, callback) => {
      handler = callback
      return () => {}
    })
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState()
    const gameStateMutator = createGameStateMutator()
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      gameStateMutator
    )

    // Act
    service.start()
    handler?.({ virtualInput: 'VI_UP', label: 'Up' })

    // Assert
    expect(gameStateMutator.update).not.toHaveBeenCalled()
    expect(messageBus.publish).not.toHaveBeenCalled()
  })

  it('does not update or publish for unknown virtual input', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | null = null
    const mockSubscribe = vi.fn((message, callback) => {
      handler = callback
      return () => {}
    })
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 4, y: 5 } })
    const gameStateMutator = createGameStateMutator()
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      gameStateMutator
    )

    // Act
    service.start()
    handler?.({ virtualInput: 'VI_UNKNOWN', label: 'Unknown' })

    // Assert
    expect(conditionResolver.evaluateCondition).not.toHaveBeenCalled()
    expect(gameStateMutator.update).not.toHaveBeenCalled()
    expect(messageBus.publish).not.toHaveBeenCalled()
  })

  it('maps virtual inputs to condition types', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | null = null
    const mockSubscribe = vi.fn((message, callback) => {
      handler = callback
      return () => {}
    })
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(false),
    }
    const state = createGameState({ mapPosition: { x: 0, y: 0 } })
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      createGameStateMutator()
    )

    // Act
    service.start()
    handler?.({ virtualInput: 'VI_UP', label: 'Up' })
    handler?.({ virtualInput: 'VI_DOWN', label: 'Down' })
    handler?.({ virtualInput: 'VI_LEFT', label: 'Left' })
    handler?.({ virtualInput: 'VI_RIGHT', label: 'Right' })

    // Assert
    expect(conditionResolver.evaluateCondition).toHaveBeenCalledWith({
      type: 'can-move-up',
    })
    expect(conditionResolver.evaluateCondition).toHaveBeenCalledWith({
      type: 'can-move-down',
    })
    expect(conditionResolver.evaluateCondition).toHaveBeenCalledWith({
      type: 'can-move-left',
    })
    expect(conditionResolver.evaluateCondition).toHaveBeenCalledWith({
      type: 'can-move-right',
    })
  })

  it('stop is safe before start', () => {
    // Arrange
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn(),
    }
    const state = createGameState()
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      createGameStateMutator()
    )

    // Act
    const stopCall = () => service.stop()

    // Assert
    expect(stopCall).not.toThrow()
    expect(messageBus.publish).not.toHaveBeenCalled()
    expect(messageBus.subscribe).not.toHaveBeenCalled()
  })

  it('stop calls unsubscribe', () => {
    // Arrange
    const mockUnsubscribe = vi.fn()
    const mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe)
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 1, y: 1 } })
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      createGameStateMutator()
    )

    // Act
    service.start()
    service.stop()

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('stop only unsubscribes once when called multiple times', () => {
    // Arrange
    const mockUnsubscribe = vi.fn()
    const mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe)
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 1, y: 1 } })
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      createGameStateMutator()
    )

    // Act
    service.start()
    service.stop()
    service.stop()

    // Assert
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })

  it('can start again after stop', () => {
    // Arrange
    const unsubscribeOne = vi.fn()
    const unsubscribeTwo = vi.fn()
    const mockSubscribe = vi
      .fn()
      .mockReturnValueOnce(unsubscribeOne)
      .mockReturnValueOnce(unsubscribeTwo)
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: mockSubscribe,
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const state = createGameState({ mapPosition: { x: 1, y: 1 } })
    const service = new MapPositionService(
      createLogger(),
      messageBus,
      conditionResolver,
      createGameStateReader(state),
      createGameStateMutator()
    )

    // Act
    service.start()
    service.stop()
    service.start()

    // Assert
    expect(mockSubscribe).toHaveBeenCalledTimes(2)
    expect(unsubscribeOne).toHaveBeenCalledTimes(1)
    expect(unsubscribeTwo).not.toHaveBeenCalled()
  })
})
