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
    getLoadedSceneIds: vi.fn(() => []),
  })

  const createMockCssFileStorage = (): ICssFileStorage => ({
    addCssFileName: vi.fn(),
    getCssFileNames: vi.fn(() => []),
  })

  const baseTimestamp = '2026-01-10T00:00:00Z'

  const baseComponent = {
    location: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    visible: true,
    border: { width: 0, padding: 0, margin: 0 },
  }

  const createScene = (id: string): Scene => ({
    id,
    createdAt: baseTimestamp,
    updatedAt: baseTimestamp,
    screen: { type: 'grid', grid: { rows: 1, columns: 1 } },
    components: [],
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
    const scene = createScene('main-menu')

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
    const scene1 = createScene('main-menu')
    const scene2 = createScene('settings')
    const scene3 = createScene('game')

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
    const scene = createScene('test-scene')

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
      ...createScene('complex-scene'),
      components: [
        {
          ...baseComponent,
          type: 'menu',
          options: [{ label: 'menu.start', actions: [{ type: 'back' }] }],
        },
        {
          ...baseComponent,
          type: 'text-log',
        },
      ],
    }

    // Act
    initializer.initializeScenes([scene])

    // Assert
    expect(sceneDataStorage.addSceneData).toHaveBeenCalledWith(
      'complex-scene',
      scene
    )
    const call = vi.mocked(sceneDataStorage.addSceneData).mock.calls[0]
    if (!call) {
      throw new Error('Expected addSceneData to be called')
    }
    const calledScene = call[1]
    expect(calledScene).toBe(scene)
    expect(calledScene.components).toHaveLength(2)
  })
})
