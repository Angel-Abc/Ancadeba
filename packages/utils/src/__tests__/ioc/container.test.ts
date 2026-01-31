import { beforeEach, describe, expect, it } from 'vitest'
import { Container } from '../../ioc/container'
import { token } from '../../ioc/token'
import type { Provider } from '../../ioc/types'
import type { ILogger } from '../../logger/types'

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

    it('should use default transient scope when scope is not specified', () => {
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
      const instances1 = container.resolveAll(testToken)
      const instances2 = container.resolveAll(testToken)

      // Assert
      expect(instance1).not.toBe(instance2)
      expect(instances1).toHaveLength(1)
      expect(instances2).toHaveLength(1)
      expect(instances1[0]).not.toBe(instances2[0])
      expect(instances1[0]).not.toBe(instance1)
      expect(instances1[0]).not.toBe(instance2)
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

    it('should maintain separate singleton instances for different providers with the same token', () => {
      // Arrange
      const testToken = token<string>('test-token')
      const provider1: Provider<string> = {
        token: testToken,
        useFactory: () => 'value-1',
        scope: 'singleton',
      }
      const provider2: Provider<string> = {
        token: testToken,
        useFactory: () => 'value-2',
        scope: 'singleton',
      }
      container.register(provider1)
      container.register(provider2)

      // Act
      const instances = container.resolveAll(testToken)

      // Assert
      expect(instances).toHaveLength(2)
      expect(instances[0]).toBe('value-1')
      expect(instances[1]).toBe('value-2')
      expect(instances[0]).not.toBe(instances[1])
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

  describe('object-based injection', () => {
    it('should use positional injection for 4 or fewer dependencies', () => {
      // Arrange
      const dep1Token = token<string>('dep1Token')
      const dep2Token = token<number>('dep2Token')
      const dep3Token = token<boolean>('dep3Token')
      const dep4Token = token<string>('dep4Token')

      class TestClass {
        constructor(
          public dep1: string,
          public dep2: number,
          public dep3: boolean,
          public dep4: string,
        ) {}
      }

      container.register({ token: dep1Token, useValue: 'value1' })
      container.register({ token: dep2Token, useValue: 42 })
      container.register({ token: dep3Token, useValue: true })
      container.register({ token: dep4Token, useValue: 'value4' })

      const testToken = token<TestClass>('test-class')
      container.register({
        token: testToken,
        useClass: TestClass,
        deps: [dep1Token, dep2Token, dep3Token, dep4Token],
        scope: 'singleton',
      })

      // Act
      const instance = container.resolve(testToken)

      // Assert
      expect(instance.dep1).toBe('value1')
      expect(instance.dep2).toBe(42)
      expect(instance.dep3).toBe(true)
      expect(instance.dep4).toBe('value4')
    })

    it('should use object injection for more than 4 dependencies', () => {
      // Arrange
      const dep1Token = token<string>('dep1Token')
      const dep2Token = token<number>('dep2Token')
      const dep3Token = token<boolean>('dep3Token')
      const dep4Token = token<string>('dep4Token')
      const dep5Token = token<string>('dep5Token')

      class TestClass {
        public dep1: string
        public dep2: number
        public dep3: boolean
        public dep4: string
        public dep5: string

        constructor(deps: {
          dep1: string
          dep2: number
          dep3: boolean
          dep4: string
          dep5: string
        }) {
          this.dep1 = deps.dep1
          this.dep2 = deps.dep2
          this.dep3 = deps.dep3
          this.dep4 = deps.dep4
          this.dep5 = deps.dep5
        }
      }

      container.register({ token: dep1Token, useValue: 'value1' })
      container.register({ token: dep2Token, useValue: 42 })
      container.register({ token: dep3Token, useValue: true })
      container.register({ token: dep4Token, useValue: 'value4' })
      container.register({ token: dep5Token, useValue: 'value5' })

      const testToken = token<TestClass>('test-class')
      container.register({
        token: testToken,
        useClass: TestClass,
        deps: [dep1Token, dep2Token, dep3Token, dep4Token, dep5Token],
        scope: 'singleton',
      })

      // Act
      const instance = container.resolve(testToken)

      // Assert
      expect(instance.dep1).toBe('value1')
      expect(instance.dep2).toBe(42)
      expect(instance.dep3).toBe(true)
      expect(instance.dep4).toBe('value4')
      expect(instance.dep5).toBe('value5')
    })

    it('should derive property names from token descriptions correctly', () => {
      // Arrange
      const loggerToken = token<string>('loggerToken')
      const gameLoaderToken = token<string>('gameLoaderToken')
      const surfaceLoaderToken = token<string>('surfaceLoaderToken')
      const worldServiceToken = token<string>('worldServiceToken')
      const bootProgressTrackerToken = token<string>('bootProgressTrackerToken')

      class TestService {
        public logger: string
        public gameLoader: string
        public surfaceLoader: string
        public worldService: string
        public bootProgressTracker: string

        constructor(deps: {
          logger: string
          gameLoader: string
          surfaceLoader: string
          worldService: string
          bootProgressTracker: string
        }) {
          this.logger = deps.logger
          this.gameLoader = deps.gameLoader
          this.surfaceLoader = deps.surfaceLoader
          this.worldService = deps.worldService
          this.bootProgressTracker = deps.bootProgressTracker
        }
      }

      container.register({ token: loggerToken, useValue: 'logger-instance' })
      container.register({
        token: gameLoaderToken,
        useValue: 'gameLoader-instance',
      })
      container.register({
        token: surfaceLoaderToken,
        useValue: 'surfaceLoader-instance',
      })
      container.register({
        token: worldServiceToken,
        useValue: 'worldService-instance',
      })
      container.register({
        token: bootProgressTrackerToken,
        useValue: 'bootProgressTracker-instance',
      })

      const testToken = token<TestService>('test-service')
      container.register({
        token: testToken,
        useClass: TestService,
        deps: [
          loggerToken,
          gameLoaderToken,
          surfaceLoaderToken,
          worldServiceToken,
          bootProgressTrackerToken,
        ],
        scope: 'singleton',
      })

      // Act
      const instance = container.resolve(testToken)

      // Assert
      expect(instance.logger).toBe('logger-instance')
      expect(instance.gameLoader).toBe('gameLoader-instance')
      expect(instance.surfaceLoader).toBe('surfaceLoader-instance')
      expect(instance.worldService).toBe('worldService-instance')
      expect(instance.bootProgressTracker).toBe('bootProgressTracker-instance')
    })
  })
})
