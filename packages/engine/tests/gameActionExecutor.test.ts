import { describe, expect, it, vi } from 'vitest'
import type { IGameActionEnvironment } from '../src/actions/types'
import { GameActionExecutor } from '../src/actions/gameActionExecutor'
import type { ISurfaceDataStorage } from '../src/storage/data/types'

function createSurfaceDataStorage(): ISurfaceDataStorage {
  let currentSurfaceId: string | null = null

  return {
    set surfaceId(value: string) {
      currentSurfaceId = value
    },
    get surfaceId(): string {
      return currentSurfaceId ?? ''
    },
    get currentSurfaceId(): string | null {
      return currentSurfaceId
    },
  }
}

function createEnvironment(): IGameActionEnvironment {
  return {
    close: vi.fn(),
  }
}

describe('game action executor', () => {
  it('navigates to the target surface', () => {
    // Arrange
    const surfaceDataStorage = createSurfaceDataStorage()
    const executor = new GameActionExecutor(
      surfaceDataStorage,
      createEnvironment(),
    )

    // Act
    executor.execute({
      type: 'navigate',
      targetSurfaceId: 'game-surface',
    })

    // Assert
    expect(surfaceDataStorage.currentSurfaceId).toBe('game-surface')
  })

  it('delegates exit actions to the environment', () => {
    // Arrange
    const environment = createEnvironment()
    const executor = new GameActionExecutor(
      createSurfaceDataStorage(),
      environment,
    )

    // Act
    executor.execute({
      type: 'exit',
    })

    // Assert
    expect(environment.close).toHaveBeenCalledOnce()
  })
})
