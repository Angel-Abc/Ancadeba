import { beforeEach, describe, expect, it } from 'vitest'
import { Container } from '../container'
import { token } from '../token'
import { Provider } from '../types'
import { ILogger } from '../../logger/types'

describe('Container', () => {
  let container: Container
  const mockLogger: ILogger = {
    error: (name: string, message: string, ...args: unknown[]) => {
      return `${name}: ${message} ${args.join(' ')}`
    },
    warn: () => '',
    info: () => '',
    debug: () => '',
  }

  beforeEach(() => {
    container = new Container(mockLogger)
  })

  describe('singleton scope', () => {
    it('should return the same instance when resolve is called multiple times', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-' + Math.random(),
        scope: 'singleton',
      }
      container.register(provider)

      // Act
      const instance1 = container.resolve(testToken)
      const instance2 = container.resolve(testToken)

      // Assert
      expect(instance1).toBe(instance2)
    })

    it('should return the same instance when resolveAll is called multiple times with singleton scope', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-' + Math.random(),
        scope: 'singleton',
      }
      container.register(provider)

      // Act
      const instances1 = container.resolveAll(testToken)
      const instances2 = container.resolveAll(testToken)

      // Assert
      expect(instances1).toHaveLength(1)
      expect(instances2).toHaveLength(1)
      expect(instances1[0]).toBe(instances2[0])
    })

    it('should return the same singleton instance from both resolve and resolveAll', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-' + Math.random(),
        scope: 'singleton',
      }
      container.register(provider)

      // Act
      const singleInstance = container.resolve(testToken)
      const allInstances = container.resolveAll(testToken)

      // Assert
      expect(allInstances).toHaveLength(1)
      expect(allInstances[0]).toBe(singleInstance)
    })

    it('should return the same singleton instance when resolveAll is called before resolve', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-' + Math.random(),
        scope: 'singleton',
      }
      container.register(provider)

      // Act
      const allInstances = container.resolveAll(testToken)
      const singleInstance = container.resolve(testToken)

      // Assert
      expect(allInstances).toHaveLength(1)
      expect(allInstances[0]).toBe(singleInstance)
    })

    it('should use default singleton scope when scope is not specified', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-' + Math.random(),
      }
      container.register(provider)

      // Act
      const instance1 = container.resolve(testToken)
      const instance2 = container.resolve(testToken)
      const instances = container.resolveAll(testToken)

      // Assert
      expect(instance1).toBe(instance2)
      expect(instances).toHaveLength(1)
      expect(instances[0]).toBe(instance1)
    })
  })

  describe('transient scope', () => {
    it('should return different instances when resolve is called multiple times with transient scope', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-' + Math.random(),
        scope: 'transient',
      }
      container.register(provider)

      // Act
      const instance1 = container.resolve(testToken)
      const instance2 = container.resolve(testToken)

      // Assert
      expect(instance1).not.toBe(instance2)
    })

    it('should return different instances when resolveAll is called multiple times with transient scope', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-' + Math.random(),
        scope: 'transient',
      }
      container.register(provider)

      // Act
      const instances1 = container.resolveAll(testToken)
      const instances2 = container.resolveAll(testToken)

      // Assert
      expect(instances1).toHaveLength(1)
      expect(instances2).toHaveLength(1)
      expect(instances1[0]).not.toBe(instances2[0])
    })
  })

  describe('multiple providers', () => {
    it('should return singleton instances for all providers when resolveAll is called', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider1: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-1-' + Math.random(),
        scope: 'singleton',
      }
      const provider2: Provider<string> = {
        token: testToken,
        useFactory: () => 'test-value-2-' + Math.random(),
        scope: 'singleton',
      }
      container.register(provider1)
      container.register(provider2)

      // Act
      const instances1 = container.resolveAll(testToken)
      const instances2 = container.resolveAll(testToken)

      // Assert
      expect(instances1).toHaveLength(2)
      expect(instances2).toHaveLength(2)
      expect(instances1[0]).toBe(instances2[0])
      expect(instances1[1]).toBe(instances2[1])
    })
  })

  describe('useClass provider', () => {
    it('should return the same singleton instance with useClass provider', () => {
      // Arrange
      class TestClass {
        id = Math.random()
      }
      const testToken = token<TestClass>('test-class')
      const provider: Provider<TestClass> = {
        token: testToken,
        useClass: TestClass,
        scope: 'singleton',
      }
      container.register(provider)

      // Act
      const instance1 = container.resolve(testToken)
      const instances = container.resolveAll(testToken)

      // Assert
      expect(instances).toHaveLength(1)
      expect(instances[0]).toBe(instance1)
      expect(instances[0]?.id).toBe(instance1.id)
    })
  })

  describe('useValue provider', () => {
    it('should return the same value instance with useValue provider', () => {
      // Arrange
      const testToken = token<string>('test-value')
      const value = 'constant-value'
      const provider: Provider<string> = {
        token: testToken,
        useValue: value,
        scope: 'singleton',
      }
      container.register(provider)

      // Act
      const instance1 = container.resolve(testToken)
      const instances = container.resolveAll(testToken)

      // Assert
      expect(instance1).toBe(value)
      expect(instances).toHaveLength(1)
      expect(instances[0]).toBe(value)
    })
  })

  describe('error handling', () => {
    it('should throw error when no provider is registered', () => {
      // Arrange
      const testToken = token<string>('unknown-token')

      // Act & Assert
      expect(() => container.resolve(testToken)).toThrow()
    })

    it('should detect circular dependencies in resolve', () => {
      // Arrange
      const token1 = token<string>('token1')
      const token2 = token<string>('token2')

      container.register({
        token: token1,
        useFactory: (c) => c.resolve(token2),
      })
      container.register({
        token: token2,
        useFactory: (c) => c.resolve(token1),
      })

      // Act & Assert
      expect(() => container.resolve(token1)).toThrow(/Circular dependency/)
    })
  })
})
