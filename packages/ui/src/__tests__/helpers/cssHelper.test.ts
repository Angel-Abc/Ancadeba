import { describe, expect, it, vi, beforeEach } from 'vitest'
import { applyCssFileOnce } from '../../helpers/cssHelper'

describe('helpers/cssHelper', () => {
  let mockDocument: Document
  let mockHead: HTMLHeadElement
  let mockLink: HTMLLinkElement
  let appendChildSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Arrange
    mockLink = {
      rel: '',
      href: '',
    } as HTMLLinkElement

    appendChildSpy = vi.fn()
    mockHead = {
      appendChild: appendChildSpy,
    } as unknown as HTMLHeadElement

    mockDocument = {
      createElement: vi.fn().mockReturnValue(mockLink),
      head: mockHead,
    } as unknown as Document
  })

  it('creates link element with correct attributes', () => {
    // Arrange
    const cssPath = '/styles/theme.css'

    // Act
    applyCssFileOnce(mockDocument, cssPath)

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledWith('link')
    expect(mockLink.rel).toBe('stylesheet')
    expect(mockLink.href).toBe(cssPath)
  })

  it('appends link to document.head', () => {
    // Arrange
    const cssPath = '/styles/main.css'

    // Act
    applyCssFileOnce(mockDocument, cssPath)

    // Assert
    expect(appendChildSpy).toHaveBeenCalledTimes(1)
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
  })

  it('does not create duplicate links when called twice with same href', () => {
    // Arrange
    const cssPath = '/styles/duplicate-test.css'

    // Act
    applyCssFileOnce(mockDocument, cssPath)
    applyCssFileOnce(mockDocument, cssPath)

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledTimes(1)
    expect(appendChildSpy).toHaveBeenCalledTimes(1)
  })

  it('creates separate links for different hrefs', () => {
    // Arrange
    const cssPath1 = '/styles/first.css'
    const cssPath2 = '/styles/second.css'
    const mockLink1 = { rel: '', href: '' } as HTMLLinkElement
    const mockLink2 = { rel: '', href: '' } as HTMLLinkElement
    vi.mocked(mockDocument.createElement)
      .mockReturnValueOnce(mockLink1)
      .mockReturnValueOnce(mockLink2)

    // Act
    applyCssFileOnce(mockDocument, cssPath1)
    applyCssFileOnce(mockDocument, cssPath2)

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledTimes(2)
    expect(appendChildSpy).toHaveBeenCalledTimes(2)
    expect(mockLink1.href).toBe(cssPath1)
    expect(mockLink2.href).toBe(cssPath2)
    expect(appendChildSpy).toHaveBeenNthCalledWith(1, mockLink1)
    expect(appendChildSpy).toHaveBeenNthCalledWith(2, mockLink2)
  })

  it('handles multiple files correctly', () => {
    // Arrange
    const cssFiles = [
      '/styles/unique-reset.css',
      '/styles/unique-theme.css',
      '/styles/unique-layout.css',
      '/styles/unique-components.css',
    ]
    const mockLinks = cssFiles.map(
      () => ({ rel: '', href: '' } as HTMLLinkElement)
    )
    const createElementMock = vi.mocked(mockDocument.createElement)
    mockLinks.forEach((link) => {
      createElementMock.mockReturnValueOnce(link)
    })

    // Act
    cssFiles.forEach((file) => applyCssFileOnce(mockDocument, file))

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledTimes(4)
    expect(appendChildSpy).toHaveBeenCalledTimes(4)
    cssFiles.forEach((file, index) => {
      const link = mockLinks[index]
      expect(link).toBeDefined()
      if (link) {
        expect(link.href).toBe(file)
        expect(link.rel).toBe('stylesheet')
      }
    })
  })

  it('does not add file again if already added in previous call', () => {
    // Arrange
    const cssPath = '/styles/already-added.css'
    applyCssFileOnce(mockDocument, cssPath)
    const initialCreateCount = vi.mocked(mockDocument.createElement).mock.calls
      .length
    const initialAppendCount = appendChildSpy.mock.calls.length

    // Act
    applyCssFileOnce(mockDocument, cssPath)

    // Assert
    expect(vi.mocked(mockDocument.createElement).mock.calls.length).toBe(
      initialCreateCount
    )
    expect(appendChildSpy.mock.calls.length).toBe(initialAppendCount)
  })

  it('maintains deduplication across multiple different and repeated files', () => {
    // Arrange
    const files = [
      '/styles/a.css',
      '/styles/b.css',
      '/styles/a.css', // duplicate
      '/styles/c.css',
      '/styles/b.css', // duplicate
      '/styles/c.css', // duplicate
    ]
    const uniqueFiles = ['/styles/a.css', '/styles/b.css', '/styles/c.css']
    const mockLinks = uniqueFiles.map(
      () => ({ rel: '', href: '' } as HTMLLinkElement)
    )
    const createElementMock = vi.mocked(mockDocument.createElement)
    mockLinks.forEach((link) => {
      createElementMock.mockReturnValueOnce(link)
    })

    // Act
    files.forEach((file) => applyCssFileOnce(mockDocument, file))

    // Assert
    expect(mockDocument.createElement).toHaveBeenCalledTimes(3)
    expect(appendChildSpy).toHaveBeenCalledTimes(3)
  })
})
