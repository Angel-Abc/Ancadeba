import { describe, expect, it, vi } from 'vitest'
import { Container, token } from '../../index'
import { createLogger } from '../testUtils'

describe('ioc/container', () => {
  it('returns singleton instances by default', () => {
    class Service {}
    const serviceToken = token<Service>('test/service')
    const container = new Container(createLogger())

    container.register({ token: serviceToken, useClass: Service })

    const first = container.resolve(serviceToken)
    const second = container.resolve(serviceToken)

    expect(first).toBe(second)
  })

  it('returns new instances for transient scope', () => {
    class Service {}
    const serviceToken = token<Service>('test/service/transient')
    const container = new Container(createLogger())

    container.register({
      token: serviceToken,
      useClass: Service,
      scope: 'transient',
    })

    const first = container.resolve(serviceToken)
    const second = container.resolve(serviceToken)

    expect(first).not.toBe(second)
  })

  it('throws on circular dependencies', () => {
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

    expect(() => container.resolve(tokenA)).toThrow()
  })

  it('creates instances from factory providers', () => {
    type Service = { name: string }
    const serviceToken = token<Service>('test/service/factory')
    const container = new Container(createLogger())

    container.register({
      token: serviceToken,
      useFactory: () => ({ name: 'factory' }),
    })

    const resolved = container.resolve(serviceToken)

    expect(resolved).toEqual({ name: 'factory' })
  })

  it('returns function values without invoking them', () => {
    const value = vi.fn(() => 'value')
    const valueToken = token<() => string>('test/service/value')
    const container = new Container(createLogger())

    container.register({ token: valueToken, useValue: value })

    const resolved = container.resolve(valueToken)

    expect(resolved).toBe(value)
    expect(value).not.toHaveBeenCalled()
  })

  it('resolves providers from parent containers', () => {
    class Service {}
    const serviceToken = token<Service>('test/service/parent')
    const parent = new Container(createLogger())
    const child = parent.createChild()

    parent.register({ token: serviceToken, useClass: Service })

    const resolved = child.resolve(serviceToken)

    expect(resolved).toBeInstanceOf(Service)
  })

  it('checks providers in parent containers with has', () => {
    class Service {}
    const serviceToken = token<Service>('test/service/has')
    const parent = new Container(createLogger())
    const child = parent.createChild()

    parent.register({ token: serviceToken, useClass: Service })

    expect(child.has(serviceToken)).toBe(true)
  })

  it('throws when registering a duplicate provider', () => {
    class Service {}
    const serviceToken = token<Service>('test/service/duplicate')
    const container = new Container(createLogger())

    container.register({ token: serviceToken, useClass: Service })

    expect(() =>
      container.register({ token: serviceToken, useClass: Service })
    ).toThrow()
  })

  it('throws when resolving an unknown token', () => {
    class Service {}
    const serviceToken = token<Service>('test/service/missing')
    const container = new Container(createLogger())

    expect(() => container.resolve(serviceToken)).toThrow()
  })
})
