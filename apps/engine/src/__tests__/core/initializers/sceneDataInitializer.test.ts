import { describe, expect, it, vi } from 'vitest'
import type { Scene } from '@ancadeba/schemas'
import type { IResourceDataStorage } from '../../../resourceData/storage'
import { SceneDataInitializer } from '../../../core/initializers/sceneDataInitializer'

describe('core/initializers/sceneDataInitializer', () => {
  const createMockResourceDataStorage = (): IResourceDataStorage => ({
    get rootPath() {
      return '/resources'
    },
    logResourceData: vi.fn(),
    addSceneData: vi.fn(),
    getSceneData: vi.fn(),
    addTileData: vi.fn(),
    getTileData: vi.fn(),
    addCssFileName: vi.fn(),
    getCssFileNames: vi.fn(() => []),
    addMapData: vi.fn(),
    getMapData: vi.fn(),
    getLanguageFileNames: vi.fn(() => []),
    setLanguageFileNames: vi.fn(),
  })

  it('processes empty array without errors', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)

    // Act
    initializer.initializeScenes([])

    // Assert
    expect(storage.addSceneData).not.toHaveBeenCalled()
  })

  it('adds single scene with correct ID', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)
    const scene: Scene = {
      id: 'main-menu',
      sceneType: 'menu',
      components: [],
    }

    // Act
    initializer.initializeScenes([scene])

    // Assert
    expect(storage.addSceneData).toHaveBeenCalledTimes(1)
    expect(storage.addSceneData).toHaveBeenCalledWith('main-menu', scene)
  })

  it('processes multiple scenes', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)
    const scene1: Scene = {
      id: 'main-menu',
      sceneType: 'menu',
      components: [],
    }
    const scene2: Scene = {
      id: 'settings',
      sceneType: 'menu',
      components: [],
    }
    const scene3: Scene = {
      id: 'game',
      sceneType: 'game',
      components: [],
    }

    // Act
    initializer.initializeScenes([scene1, scene2, scene3])

    // Assert
    expect(storage.addSceneData).toHaveBeenCalledTimes(3)
    expect(storage.addSceneData).toHaveBeenNthCalledWith(1, 'main-menu', scene1)
    expect(storage.addSceneData).toHaveBeenNthCalledWith(2, 'settings', scene2)
    expect(storage.addSceneData).toHaveBeenNthCalledWith(3, 'game', scene3)
  })

  it('handles undefined cssFileNames', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)

    // Act
    initializer.initializeStyling(undefined)

    // Assert
    expect(storage.addCssFileName).not.toHaveBeenCalled()
  })

  it('processes empty CSS array without errors', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)

    // Act
    initializer.initializeStyling([])

    // Assert
    expect(storage.addCssFileName).not.toHaveBeenCalled()
  })

  it('adds single CSS file', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)

    // Act
    initializer.initializeStyling(['game.css'])

    // Assert
    expect(storage.addCssFileName).toHaveBeenCalledTimes(1)
    expect(storage.addCssFileName).toHaveBeenCalledWith('game.css')
  })

  it('processes multiple CSS files', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)

    // Act
    initializer.initializeStyling(['game.css', 'theme.css', 'animations.css'])

    // Assert
    expect(storage.addCssFileName).toHaveBeenCalledTimes(3)
    expect(storage.addCssFileName).toHaveBeenNthCalledWith(1, 'game.css')
    expect(storage.addCssFileName).toHaveBeenNthCalledWith(2, 'theme.css')
    expect(storage.addCssFileName).toHaveBeenNthCalledWith(3, 'animations.css')
  })

  it('handles both scenes and styling together', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)
    const scene: Scene = {
      id: 'test-scene',
      sceneType: 'menu',
      components: [],
    }

    // Act
    initializer.initializeScenes([scene])
    initializer.initializeStyling(['test.css'])

    // Assert
    expect(storage.addSceneData).toHaveBeenCalledTimes(1)
    expect(storage.addSceneData).toHaveBeenCalledWith('test-scene', scene)
    expect(storage.addCssFileName).toHaveBeenCalledTimes(1)
    expect(storage.addCssFileName).toHaveBeenCalledWith('test.css')
  })

  it('preserves scene data integrity', () => {
    // Arrange
    const storage = createMockResourceDataStorage()
    const initializer = new SceneDataInitializer(storage)
    const scene: Scene = {
      id: 'complex-scene',
      sceneType: 'game',
      components: [
        { type: 'button', id: 'btn1' },
        { type: 'text', id: 'txt1' },
      ],
    }

    // Act
    initializer.initializeScenes([scene])

    // Assert
    expect(storage.addSceneData).toHaveBeenCalledWith('complex-scene', scene)
    const calledScene = vi.mocked(storage.addSceneData).mock.calls[0][1]
    expect(calledScene).toBe(scene)
    expect(calledScene.components).toHaveLength(2)
  })
})
