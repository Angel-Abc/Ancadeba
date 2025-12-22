import { describe, expect, it } from 'vitest'
import { DomHelper } from '../../helpers/domHelper'

describe('helpers/domHelper', () => {
  it('sets the document title', () => {
    // Arrange
    const document = { title: '' } as Document
    const helper = new DomHelper(document)

    // Act
    helper.setTitle('Test Title')

    // Assert
    expect(document.title).toBe('Test Title')
  })
})
