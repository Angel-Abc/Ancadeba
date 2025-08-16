import { Token, token } from '@ioc/token'
import { FINALIZE_END_TURN_MESSAGE, START_END_TURN_MESSAGE } from '@messages/system'
import { IInputSourcesService, inputSourcesServiceToken } from '@services/inputSourcesService'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface ITurnManager {
    initialize(): void
    cleanup(): void
}

const logName = 'TurnManager'
export const turnmanagerToken = token<ITurnManager>(logName)
export const turnManagerDependencies: Token<unknown>[] = [inputSourcesServiceToken, messageBusToken]
export class TurnManager implements ITurnManager {
    private cleanupFns: CleanUp[] | null = null

    constructor (
        private inputSourcesService: IInputSourcesService,
        private messageBus: IMessageBus
    ){}

    public initialize(): void {
        this.cleanup()
        this.cleanupFns = [
            this.messageBus.registerMessageListener(
                START_END_TURN_MESSAGE,
                () => this.onEndTurnStart()
            ),
            this.messageBus.registerMessageListener(
                FINALIZE_END_TURN_MESSAGE,
                () => this.onEndTurnFinalize()
            )
        ]
    }

    public cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())       
    }

    private onEndTurnStart(): void {
        // end turn code that may post new messages
        // no code here yet
    }

    private onEndTurnFinalize(): void {
        // end turn code to run after all turn messages are processed
        this.inputSourcesService.updateInputs()
    }
}
