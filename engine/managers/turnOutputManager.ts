import { Token, token } from '@ioc/token'
import { WRITE_OUTPUT, FINALIZE_END_TURN_MESSAGE } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider, TurnOutput } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface ITurnOutputManager {
    initialize(): void
    cleanup(): void
}

const logName = 'TurnOutputManager'
export const turnOutputManagerToken = token<ITurnOutputManager>(logName)
export const turnOutputManagerDependencies: Token<unknown>[] = [gameDataProviderToken, messageBusToken]

export class TurnOutputManager implements ITurnOutputManager {
    private cleanupFns: CleanUp[] | null = null

    constructor(
        private gameDataProvider: IGameDataProvider,
        private messageBus: IMessageBus
    ) { }

    public initialize(): void {
        this.cleanup()
        const context = this.gameDataProvider.Context
        if (!context.turnOutputs || context.turnOutputs.length === 0) {
            context.turnOutputs = [{ outputs: [] } as TurnOutput]
        }
        this.cleanupFns = [
            this.messageBus.registerMessageListener(
                WRITE_OUTPUT,
                msg => this.onWriteOutput(msg.payload)
            ),
            this.messageBus.registerMessageListener(
                FINALIZE_END_TURN_MESSAGE,
                () => this.onFinalizeTurn()
            )
        ]
    }

    public cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())
    }

    private onWriteOutput(payload: unknown): void {
        const context = this.gameDataProvider.Context
        const current = context.turnOutputs[context.turnOutputs.length - 1]
        current.outputs.push(payload as string)
    }

    private onFinalizeTurn(): void {
        const context = this.gameDataProvider.Context
        const current = context.turnOutputs[context.turnOutputs.length - 1]
        if (current.outputs.length > 0) {
            context.turnOutputs.push({ outputs: [] })
        }
    }
}

