import { describe, expect, it } from 'vitest'
import {
  Container,
  MessageBus,
  loggerToken,
  messageBusToken,
} from '../../index'
import { createLogger } from '../testUtils'
import { registerServices } from '../../helpers/iocHelpers'

describe('helpers/iocHelpers', () => {
  it('registers logger, message bus, and dom helper services', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)

    // Act
    registerServices(container, logger)

    const resolvedBus = container.resolve(messageBusToken)
    const resolvedLogger = container.resolve(loggerToken)

    // Assert
    expect(resolvedBus).toBeInstanceOf(MessageBus)
    expect(resolvedLogger).toBe(logger)
  })

  it('allows registering services multiple times', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)

    registerServices(container, logger)

    // Act
    const registerAgain = () => registerServices(container, logger)

    // Assert
    expect(registerAgain).not.toThrow()
  })
})
