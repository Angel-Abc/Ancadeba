import { describe, expect, it, vi } from 'vitest'
import type {
  IGameStateReader,
  IFlagStorage,
  IValueStorage,
} from '../../gameState.ts/storage'
import type { GameState } from '../../gameState.ts/types'
import { GameStateProvider } from '../../gameState.ts/provider'

describe('gameState/provider', () => {
  const createMockGameStateStorage = (): IGameStateReader &
    IFlagStorage &
    IValueStorage => {
    const mockState: GameState = {
      activeSceneId: 'test-scene',
      activeMapId: null,
      title: 'Test Game',
      flags: {},
      values: {},
      sceneStack: [],
    }
    return {
      get state() {
        return mockState
      },
      get activeSceneId() {
        return mockState.activeSceneId
      },
      get activeMapId() {
        return mockState.activeMapId
      },
      getFlag: vi.fn((flagName: string) => mockState.flags[flagName]),
      setFlag: vi.fn(),
      getValue: vi.fn((name: string) => mockState.values[name]),
      setValue: vi.fn(),
      unsetValue: vi.fn(),
    }
  }

  it('returns activeSceneId from storage', () => {
    // Arrange
    const storage = createMockGameStateStorage()
    Object.defineProperty(storage, 'activeSceneId', {
      get: () => 'main-menu',
    })
    const provider = new GameStateProvider(storage)

    // Act
    const sceneId = provider.activeSceneId

    // Assert
    expect(sceneId).toBe('main-menu')
  })

  it('returns activeMapId from storage', () => {
    // Arrange
    const storage = createMockGameStateStorage()
    Object.defineProperty(storage, 'activeMapId', {
      get: () => 'world-map',
    })
    const provider = new GameStateProvider(storage)

    // Act
    const mapId = provider.activeMapId

    // Assert
    expect(mapId).toBe('world-map')
  })

  it('returns null for activeMapId when no map is active', () => {
    // Arrange
    const storage = createMockGameStateStorage()
    Object.defineProperty(storage, 'activeMapId', {
      get: () => null,
    })
    const provider = new GameStateProvider(storage)

    // Act
    const mapId = provider.activeMapId

    // Assert
    expect(mapId).toBeNull()
  })

  it('returns gameTitle from storage state', () => {
    // Arrange
    const storage = createMockGameStateStorage()
    const provider = new GameStateProvider(storage)

    // Act
    const title = provider.gameTitle

    // Assert
    expect(title).toBe('Test Game')
  })

  it('delegates getFlag to storage', () => {
    // Arrange
    const storage = createMockGameStateStorage()
    vi.mocked(storage.getFlag).mockReturnValue(true)
    const provider = new GameStateProvider(storage)

    // Act
    const flagValue = provider.getFlag('test-flag')

    // Assert
    expect(storage.getFlag).toHaveBeenCalledWith('test-flag')
    expect(flagValue).toBe(true)
  })

  it('returns undefined for non-existent flag', () => {
    // Arrange
    const storage = createMockGameStateStorage()
    vi.mocked(storage.getFlag).mockReturnValue(undefined)
    const provider = new GameStateProvider(storage)

    // Act
    const flagValue = provider.getFlag('non-existent')

    // Assert
    expect(flagValue).toBeUndefined()
  })

  it('reflects changes in storage state', () => {
    // Arrange
    const storage = createMockGameStateStorage()
    const provider = new GameStateProvider(storage)

    // Act & Assert - Initial state
    expect(provider.gameTitle).toBe('Test Game')

    // Update storage state
    storage.state.title = 'Updated Game'
    expect(provider.gameTitle).toBe('Updated Game')
  })
})
