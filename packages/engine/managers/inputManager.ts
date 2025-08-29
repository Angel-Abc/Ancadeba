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

    /**
     * Registers a listener for virtual input messages and resets any
     * previously registered listener state.
     */
    public initialize(): void {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            VIRTUAL_INPUT,
            message => this.onVirtualInput(message.payload as string)
        )
    }

    /**
     * Removes any registered virtual input listener, restoring the manager to
     * a clean state.
     */
    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    /**
     * Looks up the active input associated with the provided virtual input and
     * executes its action when the input is enabled.
     */
    private onVirtualInput(virtualInput: string): void {
        if (this.gameDataProvider.game.activeInputs.has(virtualInput)){
            const activeInput = this.gameDataProvider.game.activeInputs.get(virtualInput)
            if (activeInput && activeInput.enabled) this.actionExecutor.execute(activeInput?.input.action, undefined, activeInput.input.label)
        }
    }
}
