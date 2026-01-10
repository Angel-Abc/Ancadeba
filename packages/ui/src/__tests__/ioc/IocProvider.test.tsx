import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Container, token, type ILogger, loggerToken } from '@ancadeba/utils'
import { IocProvider, useService } from '../../ioc/IocProvider'

const createLogger = (): ILogger => ({
  debug: () => '',
  info: () => '',
  warn: () => '',
  error: () => '',
  fatal: () => {
    throw new Error('fatal')
  },
})

interface ITestService {
  getValue(): string
}

const testServiceToken = token<ITestService>('test/service')

class TestService implements ITestService {
  getValue(): string {
    return 'test-value'
  }
}

describe('ioc/IocProvider', () => {
  it('provides container to child components', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)
    container.register({ token: loggerToken, useValue: logger })
    container.register({ token: testServiceToken, useClass: TestService })
    let resolvedService: ITestService | null = null

    function TestComponent() {
      resolvedService = useService(testServiceToken)
      return <div>Test</div>
    }

    // Act
    render(
      <IocProvider container={container}>
        <TestComponent />
      </IocProvider>
    )

    // Assert
    expect(resolvedService).toBeDefined()
    expect(resolvedService).not.toBeNull()
    expect(resolvedService!.getValue()).toBe('test-value')
  })

  it('useService resolves services from the container', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)
    container.register({ token: loggerToken, useValue: logger })
    container.register({ token: testServiceToken, useClass: TestService })
    let resolvedValue: string | null = null

    function TestComponent() {
      const service = useService(testServiceToken)
      resolvedValue = service.getValue()
      return <div>{resolvedValue}</div>
    }

    // Act
    const { getByText } = render(
      <IocProvider container={container}>
        <TestComponent />
      </IocProvider>
    )

    // Assert
    expect(resolvedValue).toBe('test-value')
    expect(getByText('test-value')).toBeInTheDocument()
  })

  it('useService throws when IocProvider is missing', () => {
    // Arrange
    function TestComponent() {
      useService(testServiceToken)
      return <div>Test</div>
    }

    // Act & Assert
    expect(() => render(<TestComponent />)).toThrow(
      'IocProvider is missing in the tree'
    )
  })

  it('useService with explicit logger bypasses container logger resolution', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)
    // Note: not registering loggerToken, but providing logger explicitly
    container.register({ token: testServiceToken, useClass: TestService })
    let resolvedService: ITestService | null = null

    function TestComponent() {
      resolvedService = useService(testServiceToken, logger)
      return <div>Test</div>
    }

    // Act
    render(
      <IocProvider container={container}>
        <TestComponent />
      </IocProvider>
    )

    // Assert
    expect(resolvedService).toBeDefined()
    expect(resolvedService).not.toBeNull()
    expect(resolvedService!.getValue()).toBe('test-value')
  })
})
