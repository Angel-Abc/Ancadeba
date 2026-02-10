import { describe, expect, it, vi } from 'vitest'
import { Container } from '../src/ioc/container'
import { token } from '../src/ioc/token'
import type { ILogger } from '../src/logger/types'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

describe('IoC container', () => {
  it('returns the same instance for singleton providers', () => {
    // Arrange
    class Service {
      id = Math.random()
    }
    const serviceToken = token<Service>('tests/ServiceToken')
    const container = new Container(createLogger())
    container.register({
      token: serviceToken,
      useClass: Service,
      deps: [],
      scope: 'singleton',
    })

    // Act
    const first = container.resolve(serviceToken)
    const second = container.resolve(serviceToken)

    // Assert
    expect(first).toBe(second)
  })

  it('returns different instances for transient providers', () => {
    // Arrange
    class Service {
      id = Math.random()
    }
    const serviceToken = token<Service>('tests/ServiceToken')
    const container = new Container(createLogger())
    container.register({
      token: serviceToken,
      useClass: Service,
      deps: [],
      scope: 'transient',
    })

    // Act
    const first = container.resolve(serviceToken)
    const second = container.resolve(serviceToken)

    // Assert
    expect(first).not.toBe(second)
  })

  it('throws when circular dependencies are resolved', () => {
    // Arrange
    const container = new Container(createLogger())

    class AService {
      constructor(public bService: BService) {}
    }

    class BService {
      constructor(public aService: AService) {}
    }

    const aToken = token<AService>('tests/AServiceToken')
    const bToken = token<BService>('tests/BServiceToken')

    container.register({
      token: aToken,
      useClass: AService,
      deps: [bToken],
      scope: 'transient',
    })
    container.register({
      token: bToken,
      useClass: BService,
      deps: [aToken],
      scope: 'transient',
    })

    // Act
    const resolveAction = (): AService => container.resolve(aToken)

    // Assert
    expect(resolveAction).toThrow('Circular dependency detected')
  })

  it('uses object injection when more than four dependencies are defined', () => {
    // Arrange
    const depOneToken = token<string>('tests/DepOneToken')
    const depTwoToken = token<string>('tests/DepTwoToken')
    const depThreeToken = token<string>('tests/DepThreeToken')
    const depFourToken = token<string>('tests/DepFourToken')
    const depFiveToken = token<string>('tests/DepFiveToken')
    const dashboardToken = token<Dashboard>('tests/DashboardToken')
    const container = new Container(createLogger())

    class Dashboard {
      constructor(
        public deps: {
          depOne: string
          depTwo: string
          depThree: string
          depFour: string
          depFive: string
        },
      ) {}
    }

    container.register({ token: depOneToken, useValue: 'one', scope: 'singleton' })
    container.register({ token: depTwoToken, useValue: 'two', scope: 'singleton' })
    container.register({
      token: depThreeToken,
      useValue: 'three',
      scope: 'singleton',
    })
    container.register({
      token: depFourToken,
      useValue: 'four',
      scope: 'singleton',
    })
    container.register({
      token: depFiveToken,
      useValue: 'five',
      scope: 'singleton',
    })
    container.register({
      token: dashboardToken,
      useClass: Dashboard,
      deps: [depOneToken, depTwoToken, depThreeToken, depFourToken, depFiveToken],
      scope: 'transient',
    })

    // Act
    const dashboard = container.resolve(dashboardToken)

    // Assert
    expect(dashboard.deps).toEqual({
      depOne: 'one',
      depTwo: 'two',
      depThree: 'three',
      depFour: 'four',
      depFive: 'five',
    })
  })
})
