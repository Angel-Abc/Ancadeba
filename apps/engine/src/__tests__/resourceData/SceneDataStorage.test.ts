import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { Scene } from '@ancadeba/schemas'
import { SceneDataStorage } from '../../resourceData/sceneDataStorage'

describe('resourceData/SceneDataStorage', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  it('stores and retrieves scene data', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new SceneDataStorage(logger)
    const scene: Scene = {
      id: 'test-scene',
      sceneType: 'menu',
      components: [],
    }

    // Act
    storage.addSceneData('test-scene', scene)
    const retrievedScene = storage.getSceneData('test-scene')

    // Assert
    expect(retrievedScene).toBe(scene)
  })

  it('throws fatal error when retrieving non-existent scene', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new SceneDataStorage(logger)

    // Act & Assert
    expect(() => storage.getSceneData('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/SceneDataStorage',
      'No scene data for id: {0}',
      'non-existent'
    )
  })

  it('handles multiple scenes', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new SceneDataStorage(logger)
    const scene1: Scene = {
      id: 'scene-1',
      sceneType: 'menu',
      components: [],
    }
    const scene2: Scene = {
      id: 'scene-2',
      sceneType: 'game',
      components: [],
    }

    // Act
    storage.addSceneData('scene-1', scene1)
    storage.addSceneData('scene-2', scene2)

    // Assert
    expect(storage.getSceneData('scene-1')).toBe(scene1)
    expect(storage.getSceneData('scene-2')).toBe(scene2)
  })
})
