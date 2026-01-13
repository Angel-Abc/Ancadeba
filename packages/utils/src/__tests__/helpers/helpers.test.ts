import { describe, it, expect } from 'vitest'
import {
  invariant,
  isDefined,
  assertNever,
  typedKeys,
  typedEntries,
} from '../../index'

describe('helpers', () => {
  describe('invariant', () => {
    it('does not throw when condition is true', () => {
      // Arrange
      const condition = true

      // Act
      const checkInvariant = () => invariant(condition, 'should not throw')

      // Assert
      expect(checkInvariant).not.toThrow()
    })

    it('throws when condition is false', () => {
      // Arrange
      const condition = false

      // Act
      const checkInvariant = () => invariant(condition, 'invariant failed')

      // Assert
      expect(checkInvariant).toThrow('invariant failed')
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

      // Act
      const throwError = () => assertNever(value)

      // Assert
      expect(throwError).toThrow()
    })
  })

  describe('typedKeys', () => {
    it('returns keys of an object with correct types', () => {
      // Arrange
      const obj = { a: 1, b: 'hello', c: true }

      // Act
      const keys = typedKeys(obj)

      // Assert
      expect(keys).toEqual(['a', 'b', 'c'])
    })

    it('works with empty objects', () => {
      // Arrange
      const obj = {}

      // Act
      const keys = typedKeys(obj)

      // Assert
      expect(keys).toEqual([])
    })

    it('returns keys for objects with mixed value types', () => {
      // Arrange
      const obj = { name: 'test', age: 42, active: false, data: null }

      // Act
      const keys = typedKeys(obj)

      // Assert
      expect(keys).toEqual(['name', 'age', 'active', 'data'])
    })
  })

  describe('typedEntries', () => {
    it('returns entries of an object with correct types', () => {
      // Arrange
      const obj = { a: 1, b: 'hello' }

      // Act
      const entries = typedEntries(obj)

      // Assert
      expect(entries).toEqual([
        ['a', 1],
        ['b', 'hello'],
      ])
    })

    it('works with empty objects', () => {
      // Arrange
      const obj = {}

      // Act
      const entries = typedEntries(obj)

      // Assert
      expect(entries).toEqual([])
    })

    it('returns entries for objects with complex values', () => {
      // Arrange
      const obj = { name: 'test', count: 42, options: { enabled: true } }

      // Act
      const entries = typedEntries(obj)

      // Assert
      expect(entries).toEqual([
        ['name', 'test'],
        ['count', 42],
        ['options', { enabled: true }],
      ])
    })
  })
})
