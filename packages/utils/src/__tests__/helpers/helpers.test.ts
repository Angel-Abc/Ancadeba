import { describe, it, expect } from 'vitest'
import { invariant, isDefined, assertNever } from '../../index'

describe('helpers', () => {
  describe('invariant', () => {
    it('does not throw when condition is true', () => {
      // Arrange
      const condition = true

      // Act / Assert
      expect(() => invariant(condition, 'should not throw')).not.toThrow()
    })

    it('throws when condition is false', () => {
      // Arrange
      const condition = false

      // Act / Assert
      expect(() => invariant(condition, 'invariant failed')).toThrow(
        'invariant failed'
      )
    })
  })

  describe('isDefined', () => {
    it('filters out null and undefined values', () => {
      // Arrange
      const values = [1, undefined, 2, null, 3]

      // Act
      const result = values.filter(isDefined)

      // Assert
      expect(result).toEqual([1, 2, 3])
    })
  })

  describe('assertNever', () => {
    it('throws when called', () => {
      // Arrange
      const value = 'unexpected' as never

      // Act / Assert
      expect(() => assertNever(value)).toThrow()
    })
  })
})
