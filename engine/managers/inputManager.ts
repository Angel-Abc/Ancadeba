import { actionExecutorToken, IActionExecutor } from '@actions/actionExecutor'
import { Token, token } from '@ioc/token'
import { VIRTUAL_INPUT } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface IInputManager {
    initialize(): void
    cleanup(): void
}

const logName = 'InputManager'
export const inputManagerToken = token<IInputManager>(logName)
export const inputManagerDependencies: Token<unknown>[] = [gameDataProviderToken, messageBusToken, actionExecutorToken]
export class InputManager implements IInputManager {
    private cleanupFn: CleanUp | null = null
    constructor(
        private gameDataProvider: IGameDataProvider,
        private messageBus: IMessageBus,
        private actionExecutor: IActionExecutor
    ){}

    public initialize(): void {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            VIRTUAL_INPUT,
            message => this.onVirtualInput(message.payload as string)
        )
    }

    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    private onVirtualInput(virtualInput: string): void {
        if (this.gameDataProvider.Game.activeInputs.has(virtualInput)){
            const activeInput = this.gameDataProvider.Game.activeInputs.get(virtualInput)
            if (activeInput) this.actionExecutor.execute(activeInput?.input.action)
        }
    }
}
