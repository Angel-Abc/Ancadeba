import { afterEach, describe, expect, it, vi } from 'vitest'
import type { IResourceConfiguration } from '@ancadeba/content'
import { GameStyleLoader } from '../src/styling/gameStyleLoader'

type ListenerName = 'error' | 'load'

type MockLinkElement = {
  rel: string
  href: string
  setAttribute: ReturnType<typeof vi.fn>
  addEventListener: (eventName: ListenerName, callback: () => void) => void
  trigger: (eventName: ListenerName) => void
}

function createMockLinkElement(): MockLinkElement {
  const listeners = new Map<ListenerName, () => void>()

  return {
    rel: '',
    href: '',
    setAttribute: vi.fn(),
    addEventListener: (eventName, callback) => {
      listeners.set(eventName, callback)
    },
    trigger: (eventName) => {
      listeners.get(eventName)?.()
    },
  }
}

describe('game style loader', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('appends stylesheets in declared order and skips duplicates across loads', async () => {
    // Arrange
    const appendedHrefs: string[] = []
    const createdLinks: MockLinkElement[] = []
    const documentMock = {
      head: {
        appendChild: vi.fn((link: MockLinkElement) => {
          appendedHrefs.push(link.href)
          link.trigger('load')
          return link
        }),
      },
      createElement: vi.fn(() => {
        const link = createMockLinkElement()
        createdLinks.push(link)
        return link
      }),
    }
    vi.stubGlobal('document', documentMock)
    const resourceConfiguration: IResourceConfiguration = {
      resourcePath: '/resources',
    }
    const loader = new GameStyleLoader(resourceConfiguration)

    // Act
    await loader.loadStyles(['styles/theme.css', 'styles/layout.css'])
    await loader.loadStyles(['styles/theme.css', 'styles/layout.css'])

    // Assert
    expect(documentMock.createElement).toHaveBeenCalledTimes(2)
    expect(documentMock.head.appendChild).toHaveBeenCalledTimes(2)
    expect(appendedHrefs).toEqual([
      '/resources/styles/theme.css',
      '/resources/styles/layout.css',
    ])
    expect(createdLinks[0].rel).toBe('stylesheet')
    expect(createdLinks[0].setAttribute).toHaveBeenCalledWith(
      'data-ancadeba-game-style',
      '/resources/styles/theme.css',
    )
    expect(createdLinks[1].setAttribute).toHaveBeenCalledWith(
      'data-ancadeba-game-style',
      '/resources/styles/layout.css',
    )
  })

  it('rejects when a stylesheet fails to load', async () => {
    // Arrange
    const documentMock = {
      head: {
        appendChild: vi.fn((link: MockLinkElement) => {
          link.trigger('error')
          return link
        }),
      },
      createElement: vi.fn(() => createMockLinkElement()),
    }
    vi.stubGlobal('document', documentMock)
    const resourceConfiguration: IResourceConfiguration = {
      resourcePath: '/resources',
    }
    const loader = new GameStyleLoader(resourceConfiguration)

    // Act
    const resultPromise = loader.loadStyles(['styles/theme.css'])

    // Assert
    await expect(resultPromise).rejects.toThrow(
      'Failed to load game style /resources/styles/theme.css',
    )
  })
})
