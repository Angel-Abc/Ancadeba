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
      activeSceneId: 'scene-2',
      activeMapId: null,
      flags: {},
      values: {},
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

  it('sets values while preserving existing values', () => {
    // Arrange
    const storage = new GameStateStorage()

    // Act
    storage.setValue('value-1', 'test-value')
    storage.setValue('value-2', 'another-value')

    // Assert
    expect(storage.state.values).toEqual({
      'value-1': 'test-value',
      'value-2': 'another-value',
    })
  })

  it('returns stored values', () => {
    // Arrange
    const storage = new GameStateStorage()
    storage.setValue('value-1', 'test-value')

    // Act
    const value = storage.getValue('value-1')

    // Assert
    expect(value).toBe('test-value')
  })

  it('returns undefined for unset values', () => {
    // Arrange
    const storage = new GameStateStorage()

    // Act
    const value = storage.getValue('non-existent')

    // Assert
    expect(value).toBeUndefined()
  })

  it('unsets values correctly', () => {
    // Arrange
    const storage = new GameStateStorage()
    storage.setValue('value-1', 'test-value')
    storage.setValue('value-2', 'another-value')

    // Act
    storage.unsetValue('value-1')

    // Assert
    expect(storage.state.values).toEqual({
      'value-2': 'another-value',
    })
  })

  it('getting unset values returns undefined', () => {
    // Arrange
    const storage = new GameStateStorage()
    storage.setValue('value-1', 'test-value')
    storage.unsetValue('value-1')

    // Act
    const value = storage.getValue('value-1')

    // Assert
    expect(value).toBeUndefined()
  })
})
