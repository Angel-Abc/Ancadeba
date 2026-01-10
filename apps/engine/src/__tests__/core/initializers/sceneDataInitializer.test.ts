import { describe, expect, it, vi } from 'vitest'
import type { Scene } from '@ancadeba/schemas'
import type {
  ISceneDataStorage,
  ICssFileStorage,
} from '../../../resourceData/storage'
import { SceneDataInitializer } from '../../../core/initializers/sceneDataInitializer'

describe('core/initializers/sceneDataInitializer', () => {
  const createMockSceneDataStorage = (): ISceneDataStorage => ({
    addSceneData: vi.fn(),
    getSceneData: vi.fn(),
  })

  const createMockCssFileStorage = (): ICssFileStorage => ({
    addCssFileName: vi.fn(),
    getCssFileNames: vi.fn(() => []),
  })

  it('processes empty array without errors', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )

    // Act
    initializer.initializeScenes([])

    // Assert
    expect(sceneDataStorage.addSceneData).not.toHaveBeenCalled()
  })

  it('adds single scene with correct ID', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )
    const scene: Scene = {
      id: 'main-menu',
      sceneType: 'menu',
      components: [],
    }

    // Act
    initializer.initializeScenes([scene])

    // Assert
    expect(sceneDataStorage.addSceneData).toHaveBeenCalledTimes(1)
    expect(sceneDataStorage.addSceneData).toHaveBeenCalledWith(
      'main-menu',
      scene
    )
  })

  it('processes multiple scenes', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )
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
    expect(sceneDataStorage.addSceneData).toHaveBeenCalledTimes(3)
    expect(sceneDataStorage.addSceneData).toHaveBeenNthCalledWith(
      1,
      'main-menu',
      scene1
    )
    expect(sceneDataStorage.addSceneData).toHaveBeenNthCalledWith(
      2,
      'settings',
      scene2
    )
    expect(sceneDataStorage.addSceneData).toHaveBeenNthCalledWith(
      3,
      'game',
      scene3
    )
  })

  it('handles undefined cssFileNames', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )

    // Act
    initializer.initializeStyling(undefined)

    // Assert
    expect(cssFileStorage.addCssFileName).not.toHaveBeenCalled()
  })

  it('processes empty CSS array without errors', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )

    // Act
    initializer.initializeStyling([])

    // Assert
    expect(cssFileStorage.addCssFileName).not.toHaveBeenCalled()
  })

  it('adds single CSS file', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )

    // Act
    initializer.initializeStyling(['game.css'])

    // Assert
    expect(cssFileStorage.addCssFileName).toHaveBeenCalledTimes(1)
    expect(cssFileStorage.addCssFileName).toHaveBeenCalledWith('game.css')
  })

  it('processes multiple CSS files', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )

    // Act
    initializer.initializeStyling(['game.css', 'theme.css', 'animations.css'])

    // Assert
    expect(cssFileStorage.addCssFileName).toHaveBeenCalledTimes(3)
    expect(cssFileStorage.addCssFileName).toHaveBeenNthCalledWith(1, 'game.css')
    expect(cssFileStorage.addCssFileName).toHaveBeenNthCalledWith(
      2,
      'theme.css'
    )
    expect(cssFileStorage.addCssFileName).toHaveBeenNthCalledWith(
      3,
      'animations.css'
    )
  })

  it('handles both scenes and styling together', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )
    const scene: Scene = {
      id: 'test-scene',
      sceneType: 'menu',
      components: [],
    }

    // Act
    initializer.initializeScenes([scene])
    initializer.initializeStyling(['test.css'])

    // Assert
    expect(sceneDataStorage.addSceneData).toHaveBeenCalledTimes(1)
    expect(sceneDataStorage.addSceneData).toHaveBeenCalledWith(
      'test-scene',
      scene
    )
    expect(cssFileStorage.addCssFileName).toHaveBeenCalledTimes(1)
    expect(cssFileStorage.addCssFileName).toHaveBeenCalledWith('test.css')
  })

  it('preserves scene data integrity', () => {
    // Arrange
    const sceneDataStorage = createMockSceneDataStorage()
    const cssFileStorage = createMockCssFileStorage()
    const initializer = new SceneDataInitializer(
      sceneDataStorage,
      cssFileStorage
    )
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
    expect(sceneDataStorage.addSceneData).toHaveBeenCalledWith(
      'complex-scene',
      scene
    )
    const calledScene = vi.mocked(sceneDataStorage.addSceneData).mock
      .calls[0][1]
    expect(calledScene).toBe(scene)
    expect(calledScene.components).toHaveLength(2)
  })
})
