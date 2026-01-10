import { describe, expect, it } from 'vitest'
import { Container, type ILogger } from '@ancadeba/utils'
import { registerServices } from '../../helpers/iocHelper'
import { domHelperToken, type IDomHelper } from '../../helpers/domHelper'

const createLogger = (): ILogger => ({
  debug: () => '',
  info: () => '',
  warn: () => '',
  error: () => '',
  fatal: () => {
    throw new Error('fatal')
  },
})

describe('helpers/iocHelper', () => {
  it('registers DomHelper with the container', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)
    const mockDocument = { title: '' } as Document

    // Act
    registerServices(container, mockDocument)

    // Assert
    const resolved = container.resolve(domHelperToken)
    expect(resolved).toBeDefined()
  })

  it('registered DomHelper uses the provided document', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)
    const mockDocument = { title: '' } as Document

    // Act
    registerServices(container, mockDocument)
    const resolved = container.resolve<IDomHelper>(domHelperToken)
    resolved.setTitle('Test Title')

    // Assert
    expect(mockDocument.title).toBe('Test Title')
  })
})
