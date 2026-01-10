import { describe, expect, it, vi } from 'vitest'
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

  it('adds CSS file to document head', () => {
    // Arrange
    const mockLink = { rel: '', href: '' } as HTMLLinkElement
    const appendChildSpy = vi.fn()
    const mockHead = {
      appendChild: appendChildSpy,
    } as unknown as HTMLHeadElement
    const mockDocument = {
      createElement: vi.fn().mockReturnValue(mockLink),
      head: mockHead,
    } as unknown as Document
    const helper = new DomHelper(mockDocument)
    const cssPath = '/styles/game.css'

    // Act
    helper.addCssFile(cssPath)

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledWith('link')
    expect(mockLink.rel).toBe('stylesheet')
    expect(mockLink.href).toBe(cssPath)
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
  })
})
