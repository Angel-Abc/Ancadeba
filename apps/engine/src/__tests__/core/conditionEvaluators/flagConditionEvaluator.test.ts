import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { Condition } from '@ancadeba/schemas'
import type { IGameStateProvider } from '../../../gameState.ts/provider'
import { FlagConditionEvaluator } from '../../../core/conditionEvaluators/FlagConditionEvaluator'

describe('core/conditionEvaluators/FlagConditionEvaluator', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  const createMockGameStateProvider = (): IGameStateProvider => ({
    get activeSceneId() {
      return 'test-scene'
    },
    get activeMapId() {
      return null
    },
    get mapPosition() {
      return undefined
    },
    get gameTitle() {
      return 'Test Game'
    },
    get inputRanges() {
      return undefined
    },
    getFlag: vi.fn(),
  })

  it('returns true for canEvaluate when condition type is flag', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    const evaluator = new FlagConditionEvaluator(logger, gameStateProvider)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }

    // Act
    const result = evaluator.canEvaluate(condition)

    // Assert
    expect(result).toBe(true)
  })

  it('returns true when flag matches expected value true', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(true)
    const evaluator = new FlagConditionEvaluator(logger, gameStateProvider)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(gameStateProvider.getFlag).toHaveBeenCalledWith('test-flag')
    expect(result).toBe(true)
  })

  it('returns true when flag matches expected value false', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(false)
    const evaluator = new FlagConditionEvaluator(logger, gameStateProvider)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: false,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(gameStateProvider.getFlag).toHaveBeenCalledWith('test-flag')
    expect(result).toBe(true)
  })

  it('returns false when flag does not match expected value', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(false)
    const evaluator = new FlagConditionEvaluator(logger, gameStateProvider)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns false and logs warning when flag is undefined', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(undefined)
    const evaluator = new FlagConditionEvaluator(logger, gameStateProvider)
    const condition: Condition = {
      type: 'flag',
      name: 'undefined-flag',
      value: true,
    }

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/conditionEvaluators/FlagConditionEvaluator',
      'Flag "{0}" is not defined',
      'undefined-flag'
    )
  })

  it('returns false when condition type is not flag', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    const evaluator = new FlagConditionEvaluator(logger, gameStateProvider)
    const condition = {
      type: 'unknown',
    } as unknown as Condition

    // Act
    const result = evaluator.evaluate(condition)

    // Assert
    expect(result).toBe(false)
  })
})
