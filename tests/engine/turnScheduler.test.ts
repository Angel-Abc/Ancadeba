import { describe, it, expect, vi } from 'vitest'
import { TurnScheduler } from '@engine/turnScheduler'
import { START_END_TURN_MESSAGE, FINALIZE_END_TURN_MESSAGE } from '../../engine/messages/system'
import type { IMessageBus } from '../../utils/messageBus'
import type { ILogger } from '@utils/logger'

describe('TurnScheduler', () => {
  it('transitions state on successive empty queue events', () => {
    const postMessage = vi.fn()
    const bus = { postMessage } as unknown as IMessageBus
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const scheduler = new TurnScheduler(bus, logger)

    // first event: start ending turn
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(1)
    expect(postMessage).toHaveBeenLastCalledWith({ message: START_END_TURN_MESSAGE, payload: null })

    // second event: finalize turn
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(2)
    expect(postMessage).toHaveBeenLastCalledWith({ message: FINALIZE_END_TURN_MESSAGE, payload: null })

    // third event: no message, reset
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(2)

    // fourth event: cycle restarts with start message
    scheduler.onQueueEmpty()
    expect(postMessage).toHaveBeenCalledTimes(3)
    expect(postMessage).toHaveBeenLastCalledWith({ message: START_END_TURN_MESSAGE, payload: null })
  })
})
