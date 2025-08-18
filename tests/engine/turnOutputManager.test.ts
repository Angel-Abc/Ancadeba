import { describe, it, expect, vi } from 'vitest'
import { TurnOutputManager } from '../../engine/managers/turnOutputManager'
import type { IGameDataProvider, GameData, GameContext } from '../../engine/providers/gameDataProvider'
import type { IMessageBus } from '../../utils/messageBus'
import { WRITE_OUTPUT, FINALIZE_END_TURN_MESSAGE } from '../../engine/messages/system'

function createManager(context: GameContext) {
  const provider = {
    get Game() { return {} as GameData },
    get Context() { return context },
    initialize: vi.fn()
  } as unknown as IGameDataProvider
  const listeners: Record<string, (msg: { message: string, payload: unknown }) => void> = {}
  const messageBus = {
    registerMessageListener: vi.fn((message: string, handler: (msg: { message: string, payload: unknown }) => void) => {
      listeners[message] = handler
      return () => { delete listeners[message] }
    }),
    postMessage: vi.fn()
  } as unknown as IMessageBus
  const manager = new TurnOutputManager(provider, messageBus)
  return { manager, listeners }
}

describe('TurnOutputManager', () => {
  it('aggregates output per turn', () => {
    const context = { turnOutputs: [{ outputs: [] }] } as unknown as GameContext
    const { manager, listeners } = createManager(context)

    manager.initialize()
    listeners[WRITE_OUTPUT]!({ message: WRITE_OUTPUT, payload: 'one' })
    listeners[WRITE_OUTPUT]!({ message: WRITE_OUTPUT, payload: 'two' })
    expect(context.turnOutputs).toEqual([{ outputs: ['one', 'two'] }])

    listeners[FINALIZE_END_TURN_MESSAGE]!({ message: FINALIZE_END_TURN_MESSAGE, payload: null })
    listeners[WRITE_OUTPUT]!({ message: WRITE_OUTPUT, payload: 'three' })
    expect(context.turnOutputs).toEqual([
      { outputs: ['one', 'two'] },
      { outputs: ['three'] }
    ])
  })
})
