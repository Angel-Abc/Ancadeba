/**
 * Manages progression through the end-of-turn phases. When the message queue
 * becomes empty, the scheduler advances from `NOT_STARTED` to `STARTED` and
 * then to `FINALIZING`, emitting messages at each stage before resetting to
 * `NOT_STARTED` for the next turn.
 */
import { Token, token } from '@ioc/token'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { FINALIZE_END_TURN_MESSAGE, START_END_TURN_MESSAGE } from '@messages/system'
import { logDebug } from '@utils/logMessage'


export interface ITurnScheduler {
    /**
     * Invoked when the message queue has been fully processed. This is the
     * trigger point for advancing the turn through its end phases.
     */
    onQueueEmpty(): void
}

/**
 * Enumerates the stages involved in ending a turn:
 * - `NOT_STARTED`: No end-of-turn processing has begun.
 * - `STARTED`: Initial end-of-turn message dispatched, awaiting completion.
 * - `FINALIZING`: Finalization message dispatched; next empty queue completes the turn.
 */
export const EndingTurnState = {
    NOT_STARTED: 0,
    STARTED: 1,
    FINALIZING: 2
} as const
// eslint-disable-next-line no-redeclare
export type EndingTurnState = typeof EndingTurnState[keyof typeof EndingTurnState]

const logName: string = 'TurnScheduler'
export const turnSchedulerToken = token<ITurnScheduler>(logName)
export const turnSchedulerDependencies: Token<unknown>[] = [messageBusToken]

/**
 * Listens for empty message queues and progresses the game through the end of
 * a turn. Each time the queue empties the scheduler moves through
 * `NOT_STARTED` → `STARTED` → `FINALIZING` → `NOT_STARTED`, posting start and
 * finalize messages along the way.
 */
export class TurnScheduler implements ITurnScheduler {
    private endingTurn: EndingTurnState

    /**
     * Creates a new scheduler wired to the provided message bus.
     * @param messageBus Bus used to post turn progression messages.
     */
    constructor(private messageBus: IMessageBus) {
        this.endingTurn = EndingTurnState.NOT_STARTED
    }

    /**
     * Advances the end-of-turn state machine whenever the queue empties.
     * Depending on the current phase, either a start or finalize message is
     * dispatched, or the cycle resets when finalization completes.
     */
    public onQueueEmpty(): void {
        switch (this.endingTurn) {
            case EndingTurnState.NOT_STARTED:
                this.endingTurn = EndingTurnState.STARTED
                this.messageBus.postMessage({
                    message: START_END_TURN_MESSAGE,
                    payload: null
                })
                break
            case EndingTurnState.STARTED:
                this.endingTurn = EndingTurnState.FINALIZING
                this.messageBus.postMessage({
                    message: FINALIZE_END_TURN_MESSAGE,
                    payload: null
                })
                break
            case EndingTurnState.FINALIZING:
                this.endingTurn = EndingTurnState.NOT_STARTED
                logDebug(logName, 'Turn finalized')
                break
        }
    }
}

