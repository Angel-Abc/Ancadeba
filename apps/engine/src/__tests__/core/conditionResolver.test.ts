import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { Condition } from '@ancadeba/schemas'
import type { IGameStateProvider } from '../../gameState.ts/provider'
import { ConditionResolver } from '../../core/conditionResolver'
import { FlagConditionEvaluator } from '../../core/conditionEvaluators/FlagConditionEvaluator'

describe('core/conditionResolver', () => {
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
    get gameTitle() {
      return 'Test Game'
    },
    getFlag: vi.fn(),
  })

  it('returns true when flag matches expected value true', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(true)
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }

    // Act
    const result = resolver.evaluateCondition(condition)

    // Assert
    expect(gameStateProvider.getFlag).toHaveBeenCalledWith('test-flag')
    expect(result).toBe(true)
  })

  it('returns true when flag matches expected value false', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(false)
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: false,
    }

    // Act
    const result = resolver.evaluateCondition(condition)

    // Assert
    expect(gameStateProvider.getFlag).toHaveBeenCalledWith('test-flag')
    expect(result).toBe(true)
  })

  it('returns false when flag does not match expected value', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(false)
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)
    const condition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }

    // Act
    const result = resolver.evaluateCondition(condition)

    // Assert
    expect(result).toBe(false)
  })

  it('returns false and logs warning when flag is undefined', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(undefined)
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)
    const condition: Condition = {
      type: 'flag',
      name: 'undefined-flag',
      value: true,
    }

    // Act
    const result = resolver.evaluateCondition(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/conditionEvaluators/FlagConditionEvaluator',
      'Flag "{0}" is not defined',
      'undefined-flag'
    )
  })

  it('returns false and logs warning for unknown condition type', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)
    const condition = {
      type: 'unknown',
    } as unknown as Condition

    // Act
    const result = resolver.evaluateCondition(condition)

    // Assert
    expect(result).toBe(false)
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/ConditionResolver',
      'No evaluator for condition type: {0}',
      'unknown'
    )
  })

  it('evaluates multiple flag conditions correctly', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true)
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)

    const condition1: Condition = { type: 'flag', name: 'flag1', value: true }
    const condition2: Condition = { type: 'flag', name: 'flag2', value: true }
    const condition3: Condition = { type: 'flag', name: 'flag3', value: true }

    // Act
    const result1 = resolver.evaluateCondition(condition1)
    const result2 = resolver.evaluateCondition(condition2)
    const result3 = resolver.evaluateCondition(condition3)

    // Assert
    expect(result1).toBe(true)
    expect(result2).toBe(false)
    expect(result3).toBe(true)
  })

  it('handles different flag names correctly', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockImplementation((name) => {
      return name === 'enabled-flag'
    })
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)

    const enabledCondition: Condition = {
      type: 'flag',
      name: 'enabled-flag',
      value: true,
    }
    const disabledCondition: Condition = {
      type: 'flag',
      name: 'disabled-flag',
      value: true,
    }

    // Act
    const enabledResult = resolver.evaluateCondition(enabledCondition)
    const disabledResult = resolver.evaluateCondition(disabledCondition)

    // Assert
    expect(enabledResult).toBe(true)
    expect(disabledResult).toBe(false)
  })

  it('checks flag value equality strictly', () => {
    // Arrange
    const logger = createMockLogger()
    const gameStateProvider = createMockGameStateProvider()
    vi.mocked(gameStateProvider.getFlag).mockReturnValue(true)
    const evaluators = [new FlagConditionEvaluator(logger, gameStateProvider)]
    const resolver = new ConditionResolver(logger, evaluators)

    const trueCondition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: true,
    }
    const falseCondition: Condition = {
      type: 'flag',
      name: 'test-flag',
      value: false,
    }

    // Act
    const trueResult = resolver.evaluateCondition(trueCondition)
    const falseResult = resolver.evaluateCondition(falseCondition)

    // Assert
    expect(trueResult).toBe(true)
    expect(falseResult).toBe(false)
  })
})
