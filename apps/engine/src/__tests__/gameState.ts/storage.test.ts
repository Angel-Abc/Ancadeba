import { describe, expect, it } from 'vitest'
import { GameStateStorage } from '../../gameState.ts/storage'

describe('gameState/storage', () => {
  it('merges updates without dropping existing state', () => {
    // Arrange
    const storage = new GameStateStorage()

    // Act
    storage.update({ title: 'Original Title', activeSceneId: 'scene-1' })
    storage.update({ activeSceneId: 'scene-2' })

    // Assert
    expect(storage.state).toEqual({
      title: 'Original Title',
      activeScene: 'scene-2',
      flags: {},
      sceneStack: [],
    })
  })

  it('sets flags while preserving existing flags', () => {
    // Arrange
    const storage = new GameStateStorage()

    // Act
    storage.setFlag('flag-1', true)
    storage.setFlag('flag-2', false)

    // Assert
    expect(storage.state.flags).toEqual({
      'flag-1': true,
      'flag-2': false,
    })
  })

  it('returns stored flag values', () => {
    // Arrange
    const storage = new GameStateStorage()
    storage.setFlag('flag-1', true)

    // Act
    const value = storage.getFlag('flag-1')

    // Assert
    expect(value).toBe(true)
  })
})
