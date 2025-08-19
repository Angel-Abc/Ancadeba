import { describe, it, expect, vi } from 'vitest'
import { TurnScheduler, EndingTurnState } from '../../packages/engine/core/turnScheduler'
import { START_END_TURN_MESSAGE, FINALIZE_END_TURN_MESSAGE } from '../../packages/engine/messages/system'
import type { IMessageBus } from '../../packages/shared/messageBus'
import type { ILogger } from '@utils/logger'

describe('TurnScheduler', () => {
  it('transitions state on successive empty queue events', () => {
    const postMessage = vi.fn()
    const bus = { postMessage } as unknown as IMessageBus
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const scheduler = new TurnScheduler(bus, logger)
    const state = scheduler as unknown as { endingTurn: EndingTurnState }

    expect(state.endingTurn).toBe(EndingTurnState.NOT_STARTED)

    // first event: start ending turn
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(1)
    expect(postMessage).toHaveBeenLastCalledWith({ message: START_END_TURN_MESSAGE, payload: null })
    expect(state.endingTurn).toBe(EndingTurnState.STARTED)

    // second event: finalize turn
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(2)
    expect(postMessage).toHaveBeenLastCalledWith({ message: FINALIZE_END_TURN_MESSAGE, payload: null })
    expect(state.endingTurn).toBe(EndingTurnState.FINALIZING)

    // third event: no message, reset
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(2)
    expect(state.endingTurn).toBe(EndingTurnState.NOT_STARTED)

    // fourth event: cycle restarts with start message
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(3)
    expect(postMessage).toHaveBeenLastCalledWith({ message: START_END_TURN_MESSAGE, payload: null })
    expect(state.endingTurn).toBe(EndingTurnState.STARTED)
  })
})
