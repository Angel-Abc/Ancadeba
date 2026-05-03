import { describe, expect, it, vi } from 'vitest'
import type { ILogger, IMessageBus } from '@ancadeba/utils'
import { SurfaceDataStorage } from '../src/storage/data/surfaceDataStorage'
import { MESSAGE_ENGINE_SURFACE_DATA_CHANGED } from '../src/storage/data/messages'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

function createMessageBus(): IMessageBus {
  return {
    publish: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  }
}

describe('surface data storage', () => {
  it('exposes the current surface without throwing before and after updates', () => {
    // Arrange
    const messageBus = createMessageBus()
    const storage = new SurfaceDataStorage(createLogger(), messageBus)

    // Act
    const initialSurfaceId = storage.currentSurfaceId
    storage.surfaceId = 'boot-loader'

    // Assert
    expect(initialSurfaceId).toBeNull()
    expect(storage.currentSurfaceId).toBe('boot-loader')
    expect(messageBus.publish).toHaveBeenCalledWith(
      MESSAGE_ENGINE_SURFACE_DATA_CHANGED,
      { surfaceId: 'boot-loader' },
    )
  })
})
