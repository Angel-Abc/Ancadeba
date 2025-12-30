// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { BrowserAdapter } from '../../system/browserAdapter'

describe('system/browserAdapter', () => {
  it('delegates reload to window.location.reload', () => {
    // Arrange
    const originalWindow = (globalThis as { window?: Window }).window
    const reload = vi.fn()
    ;(globalThis as { window: Window }).window = {
      location: {
        reload,
      },
    } as unknown as Window
    const adapter = new BrowserAdapter()

    try {
      // Act
      adapter.reload()

      // Assert
      expect(reload).toHaveBeenCalledTimes(1)
    } finally {
      if (originalWindow) {
        ;(globalThis as { window: Window }).window = originalWindow
      } else {
        delete (globalThis as { window?: Window }).window
      }
    }
  })
})
