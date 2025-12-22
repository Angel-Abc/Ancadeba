import { describe, expect, it } from 'vitest'
import {
  Container,
  DomHelper,
  MessageBus,
  domHelperToken,
  loggerToken,
  messageBusToken,
} from '../../index'
import { createLogger } from '../testUtils'
import { registerServices } from '../../helpers/iocHelpers'

describe('helpers/iocHelpers', () => {
  it('registers logger, message bus, and dom helper services', () => {
    // Arrange
    const logger = createLogger()
    const document = { title: '' } as Document
    const container = new Container(logger)

    // Act
    registerServices(container, logger, document)

    const resolvedBus = container.resolve(messageBusToken)
    const resolvedDomHelper = container.resolve(domHelperToken)
    const resolvedLogger = container.resolve(loggerToken)
    resolvedDomHelper.setTitle('Test')

    // Assert
    expect(resolvedBus).toBeInstanceOf(MessageBus)
    expect(resolvedDomHelper).toBeInstanceOf(DomHelper)
    expect(resolvedLogger).toBe(logger)
    expect(document.title).toBe('Test')
  })

  it('throws when registering services twice', () => {
    // Arrange
    const logger = createLogger()
    const document = { title: '' } as Document
    const container = new Container(logger)

    registerServices(container, logger, document)

    // Act
    const registerDuplicate = () => registerServices(container, logger, document)

    // Assert
    expect(registerDuplicate).toThrow()
  })
})
