import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { Condition } from '@ancadeba/schemas'
import type { IGameStateProvider } from '../../../gameState.ts/provider'
import { ValueConditionEvaluator } from '../../../core/conditionEvaluators/ValueConditionEvaluator'

describe('core/conditionEvaluators/ValueConditionEvaluator', () => {
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
    getValue: vi.fn(),
  })

  describe('canEvaluate', () => {
    it('returns true for value-set conditions', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-set',
        name: 'player-choice',
      }

      // Act
      const result = evaluator.canEvaluate(condition)

      // Assert
      expect(result).toBe(true)
    })

    it('returns true for value-not-set conditions', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-not-set',
        name: 'player-choice',
      }

      // Act
      const result = evaluator.canEvaluate(condition)

      // Assert
      expect(result).toBe(true)
    })

    it('returns true for value-equals conditions', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-equals',
        name: 'player-choice',
        value: 'helped-merchant',
      }

      // Act
      const result = evaluator.canEvaluate(condition)

      // Assert
      expect(result).toBe(true)
    })

    it('returns false for other condition types', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'flag',
        name: 'test-flag',
        value: true,
      }

      // Act
      const result = evaluator.canEvaluate(condition)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('evaluate - value-set', () => {
    it('returns true when value exists', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue('some-value')
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-set',
        name: 'player-choice',
      }

      // Act
      const result = evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('player-choice')
      expect(result).toBe(true)
    })

    it('returns false when value is undefined', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue(undefined)
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-set',
        name: 'player-choice',
      }

      // Act
      const result = evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('player-choice')
      expect(result).toBe(false)
    })

    it('returns false for non-matching condition types', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
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
  })

  describe('evaluate - value-not-set', () => {
    it('returns true when value is undefined', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue(undefined)
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-not-set',
        name: 'player-choice',
      }

      // Act
      const result = evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('player-choice')
      expect(result).toBe(true)
    })

    it('returns false when value exists', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue('some-value')
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-not-set',
        name: 'player-choice',
      }

      // Act
      const result = evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('player-choice')
      expect(result).toBe(false)
    })

    it('returns false for non-matching condition types', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
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
  })

  describe('evaluate - value-equals', () => {
    it('returns true when value matches expected string', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue('helped-merchant')
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-equals',
        name: 'player-choice',
        value: 'helped-merchant',
      }

      // Act
      const result = evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('player-choice')
      expect(result).toBe(true)
    })

    it('returns false when value does not match', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue('attacked-merchant')
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-equals',
        name: 'player-choice',
        value: 'helped-merchant',
      }

      // Act
      const result = evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('player-choice')
      expect(result).toBe(false)
    })

    it('returns false when value is undefined', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue(undefined)
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-equals',
        name: 'player-choice',
        value: 'helped-merchant',
      }

      // Act
      const result = evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('player-choice')
      expect(logger.warn).toHaveBeenCalledWith(
        'engine/core/conditionEvaluators/ValueConditionEvaluator',
        'Value "{0}" is not defined',
        'player-choice'
      )
      expect(result).toBe(false)
    })

    it('returns false for non-matching condition types', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
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

    it('calls getValue with correct name parameter', () => {
      // Arrange
      const logger = createMockLogger()
      const gameStateProvider = createMockGameStateProvider()
      vi.mocked(gameStateProvider.getValue).mockReturnValue('some-value')
      const evaluator = new ValueConditionEvaluator(logger, gameStateProvider)
      const condition: Condition = {
        type: 'value-equals',
        name: 'specific-name',
        value: 'some-value',
      }

      // Act
      evaluator.evaluate(condition)

      // Assert
      expect(gameStateProvider.getValue).toHaveBeenCalledTimes(1)
      expect(gameStateProvider.getValue).toHaveBeenCalledWith('specific-name')
    })
  })
})
