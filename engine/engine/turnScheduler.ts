import { Token, token } from '@ioc/token'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { FINALIZE_END_TURN_MESSAGE, START_END_TURN_MESSAGE } from '../messages/system'
import { logDebug } from '@utils/logMessage'


export interface ITurnScheduler {
    onQueueEmpty(): void
}

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
export class TurnScheduler implements ITurnScheduler {
    private endingTurn: EndingTurnState

    constructor(private messageBus: IMessageBus) {
        this.endingTurn = EndingTurnState.NOT_STARTED
    }

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

