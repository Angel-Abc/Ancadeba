import { describe, expect, it, vi } from 'vitest'
import { Container, token } from '../../index'
import { createLogger } from '../testUtils'

describe('ioc/container', () => {
  it('returns singleton instances by default', () => {
    // Arrange
    class Service {}
    const serviceToken = token<Service>('test/service')
    const container = new Container(createLogger())

    container.register({ token: serviceToken, useClass: Service })

    // Act
    const first = container.resolve(serviceToken)
    const second = container.resolve(serviceToken)

    // Assert
    expect(first).toBe(second)
  })

  it('returns new instances for transient scope', () => {
    // Arrange
    class Service {}
    const serviceToken = token<Service>('test/service/transient')
    const container = new Container(createLogger())

    container.register({
      token: serviceToken,
      useClass: Service,
      scope: 'transient',
    })

    // Act
    const first = container.resolve(serviceToken)
    const second = container.resolve(serviceToken)

    // Assert
    expect(first).not.toBe(second)
  })

  it('throws on circular dependencies', () => {
    // Arrange
    class ServiceA {}
    class ServiceB {}
    const tokenA = token<ServiceA>('test/service/a')
    const tokenB = token<ServiceB>('test/service/b')
    const container = new Container(createLogger())

    container.register({
      token: tokenA,
      useClass: ServiceA,
      deps: [tokenB],
    })
    container.register({
      token: tokenB,
      useClass: ServiceB,
      deps: [tokenA],
    })

    // Act
    const resolveCircular = () => container.resolve(tokenA)

    // Assert
    expect(resolveCircular).toThrow()
  })

  it('creates instances from factory providers', () => {
    // Arrange
    type Service = { name: string }
    const serviceToken = token<Service>('test/service/factory')
    const container = new Container(createLogger())

    container.register({
      token: serviceToken,
      useFactory: () => ({ name: 'factory' }),
    })

    // Act
    const resolved = container.resolve(serviceToken)

    // Assert
    expect(resolved).toEqual({ name: 'factory' })
  })

  it('returns function values without invoking them', () => {
    // Arrange
    const value = vi.fn(() => 'value')
    const valueToken = token<() => string>('test/service/value')
    const container = new Container(createLogger())

    container.register({ token: valueToken, useValue: value })

    // Act
    const resolved = container.resolve(valueToken)

    // Assert
    expect(resolved).toBe(value)
    expect(value).not.toHaveBeenCalled()
  })

  it('resolves providers from parent containers', () => {
    // Arrange
    class Service {}
    const serviceToken = token<Service>('test/service/parent')
    const parent = new Container(createLogger())
    const child = parent.createChild()

    parent.register({ token: serviceToken, useClass: Service })

    // Act
    const resolved = child.resolve(serviceToken)

    // Assert
    expect(resolved).toBeInstanceOf(Service)
  })

  it('checks providers in parent containers with has', () => {
    // Arrange
    class Service {}
    const serviceToken = token<Service>('test/service/has')
    const parent = new Container(createLogger())
    const child = parent.createChild()

    parent.register({ token: serviceToken, useClass: Service })

    // Act
    const hasService = child.has(serviceToken)

    // Assert
    expect(hasService).toBe(true)
  })

  it('throws when registering a duplicate provider', () => {
    // Arrange
    class Service {}
    const serviceToken = token<Service>('test/service/duplicate')
    const container = new Container(createLogger())

    container.register({ token: serviceToken, useClass: Service })

    // Act
    const registerDuplicate = () =>
      container.register({ token: serviceToken, useClass: Service })

    // Assert
    expect(registerDuplicate).toThrow()
  })

  it('throws when resolving an unknown token', () => {
    // Arrange
    class Service {}
    const serviceToken = token<Service>('test/service/missing')
    const container = new Container(createLogger())

    // Act
    const resolveMissing = () => container.resolve(serviceToken)

    // Assert
    expect(resolveMissing).toThrow()
  })
})
