import { describe, it, expect, vi } from 'vitest'
import { PlayerPositionManager } from '../../engine/managers/playerPositionManager'
import type { IGameDataProvider, GameData, GameContext } from '../../engine/providers/gameDataProvider'
import type { Position } from '../../engine/loader/data/map'
import type { IMessageBus } from '../../utils/messageBus'
import { POSITION_CHANGED } from '../../engine/messages/system'

function createManager(context: GameContext) {
  const provider = {
    get Game() { return {} as GameData },
    get Context() { return context },
    initialize: vi.fn(),
  } as unknown as IGameDataProvider
  const messageBus = { postMessage: vi.fn(), registerMessageListener: vi.fn() } as unknown as IMessageBus
  return { manager: new PlayerPositionManager(provider, messageBus), messageBus }
}

describe('PlayerPositionManager.changePosition', () => {
  it('updates player position in context', () => {
    const context = { player: { position: { x: 0, y: 0 } } } as unknown as GameContext
    const { manager, messageBus } = createManager(context)
    const newPos: Position = { x: 5, y: 7 }

    manager.changePosition(newPos)

    expect(context.player.position).toEqual(newPos)
    expect(messageBus.postMessage).toHaveBeenCalledWith({
      message: POSITION_CHANGED,
      payload: newPos,
    })
  })
})

describe('PlayerPositionManager.initialize', () => {
  it('clears previous listener on repeated initialization', () => {
    const cleanup = vi.fn()
    const register = vi.fn()
      .mockReturnValueOnce(cleanup)
      .mockReturnValue(() => {})

    const messageBus = {
      registerMessageListener: register,
      postMessage: vi.fn(),
    } as unknown as IMessageBus

    const provider = {} as unknown as IGameDataProvider

    const manager = new PlayerPositionManager(provider, messageBus)

    manager.initialize()
    manager.initialize()

    expect(cleanup).toHaveBeenCalledTimes(1)
    expect(register).toHaveBeenCalledTimes(2)
  })
})
