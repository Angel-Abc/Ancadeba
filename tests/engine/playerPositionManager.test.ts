import { describe, it, expect, vi } from 'vitest'
import { PlayerPositionManager } from '../../engine/managers/playerPositionManager'
import type { IGameDataProvider, GameData, GameContext } from '../../engine/providers/gameDataProvider'
import type { Position } from '../../engine/loader/data/map'

function createManager(context: GameContext) {
  const provider = {
    get Game() { return {} as GameData },
    get Context() { return context },
    initialize: vi.fn(),
  } as unknown as IGameDataProvider
  return new PlayerPositionManager(provider)
}

describe('PlayerPositionManager.changePosition', () => {
  it('updates player position in context', () => {
    const context = { player: { position: { x: 0, y: 0 } } } as unknown as GameContext
    const manager = createManager(context)
    const newPos: Position = { x: 5, y: 7 }

    manager.changePosition(newPos)

    expect(context.player.position).toEqual(newPos)
  })
})
