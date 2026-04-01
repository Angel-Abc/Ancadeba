import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { ISurfaceDataStorage } from '../src/storage/data/types'
import { BootstrapFinalizer } from '../src/bootstrap/bootstrapFinalizer'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

describe('bootstrap finalizer', () => {
  it('sets the active surface to the configured start surface', async () => {
    // Arrange
    let currentSurfaceId: string | null = null
    const surfaceDataStorage: ISurfaceDataStorage = {
      set surfaceId(value: string) {
        currentSurfaceId = value
      },
      get surfaceId(): string {
        return currentSurfaceId ?? ''
      },
    }
    const bootstrapFinalizer = new BootstrapFinalizer(
      createLogger(),
      surfaceDataStorage,
    )

    // Act
    await bootstrapFinalizer.execute({
      title: 'GAME.TITLE',
      version: '1.0.0',
      bootSurfaceId: 'boot-loader',
      startSurfaceId: 'main-menu',
      language: 'en',
      styles: ['styles/theme.css'],
      surfaces: {
        'boot-loader': 'surfaces/boot-loader.json',
        'main-menu': 'surfaces/main-menu.json',
      },
      widgets: { 'boot-progress': 'widgets/boot-progress.json' },
      languages: { en: ['languages/en/engine.json'] },
    })

    // Assert
    expect(currentSurfaceId).toBe('main-menu')
  })
})
