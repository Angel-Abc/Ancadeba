import { describe, it, expect, vi } from 'vitest'
import { TileTriggerManager } from '../../packages/engine/managers/tileTriggerManager'
import type { IGameDataProvider, GameData, GameContext } from '../../packages/engine/providers/gameDataProvider'
import type { IMessageBus } from '../../packages/shared/messageBus'
import type { IActionExecutor } from '../../packages/engine/actions/actionExecutor'
import type { GameMap, MapTile, Position } from '../../packages/engine/loader/data/map'
import { POSITION_CHANGED } from '../../packages/engine/messages/system'
import type { Message } from '../../packages/shared/types'

function setup(tile?: MapTile) {
  const actionExecutor = { execute: vi.fn() } as unknown as IActionExecutor
  const map: GameMap = {
    key: 'map',
    type: 'squares-map',
    width: 1,
    height: 1,
    tileSets: [],
    tiles: { t1: tile ?? { key: 't1', tile: 'tile' } },
    map: [['t1']]
  }
  const provider = {
    get Game() { return { loadedMaps: { map } } as unknown as GameData },
    get Context() { return { currentMap: { id: 'map', width: 1, height: 1 } } as unknown as GameContext },
    initialize: vi.fn()
  } as unknown as IGameDataProvider
  let handler: (message: Message<unknown>) => void = () => {}
  const messageBus = {
    registerMessageListener: vi.fn().mockImplementation((msg, cb) => {
      if (msg === POSITION_CHANGED) handler = cb
      return () => {}
    }),
    postMessage: vi.fn()
  } as unknown as IMessageBus
  const manager = new TileTriggerManager(provider, messageBus, actionExecutor)
  manager.initialize()
  return { handler, actionExecutor, messageBus }
}

describe('TileTriggerManager', () => {
  it('executes onEnter action on tile entry', () => {
    const action = { type: 'script', script: '' } as const
    const { handler, actionExecutor, messageBus } = setup({ key: 't1', tile: 'tile', onEnter: action })
    expect(messageBus.registerMessageListener).toHaveBeenCalledWith(POSITION_CHANGED, expect.any(Function))
    const pos: Position = { x: 0, y: 0 }
    const msg: Message<unknown> = { message: POSITION_CHANGED, payload: pos }
    handler(msg)
    expect(actionExecutor.execute).toHaveBeenCalledWith(action, msg)
  })

  it('ignores tiles without onEnter action', () => {
    const { handler, actionExecutor } = setup({ key: 't1', tile: 'tile' })
    const pos: Position = { x: 0, y: 0 }
    handler({ message: POSITION_CHANGED, payload: pos })
    expect(actionExecutor.execute).not.toHaveBeenCalled()
  })
})

