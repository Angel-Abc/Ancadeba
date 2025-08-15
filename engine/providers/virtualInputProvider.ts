import { Token, token } from '@ioc/token'
import { IVirtualInputsLoader, virtualInputsLoaderToken } from '@loader/virtualInputsLoader'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { gameDataProviderToken, IGameDataProvider } from './gameDataProvider'
import { CleanUp } from '@utils/types'
import { VIRTUAL_INPUT, VIRTUAL_KEY } from '@messages/system'

export interface IVirtualInputProvider {
    initialize(): Promise<void>
    cleanup(): void
}

const logName = 'VirtualInputProvider'
export const virtualInputProviderToken = token<IVirtualInputProvider>(logName)
export const virtualInputProviderDependencies: Token<unknown>[] = [
    virtualInputsLoaderToken,
    messageBusToken,
    gameDataProviderToken
]
export class VirtualInputProvider implements IVirtualInputProvider {
    private CleanUpFn: CleanUp | null = null

    constructor(
        private virtualInputsLoader: IVirtualInputsLoader,
        private messagebus: IMessageBus,
        private gameDataProvider: IGameDataProvider
    ) {}

    public async initialize(): Promise<void> {
        if (this.gameDataProvider.Game.loadedVirtualInputs.size === 0) await this.loadVirtualInputs()
        this.CleanUpFn = this.messagebus.registerMessageListener(
            VIRTUAL_KEY,
            message => {
                if (message.payload && this.gameDataProvider.Game.loadedVirtualInputs.has(message.payload as string)) {
                    this.messagebus.postMessage({
                        message: VIRTUAL_INPUT,
                        payload: this.gameDataProvider.Game.loadedVirtualInputs.get(message.payload as string)?.virtualInput
                    })
                }
            }
        )
    }

    public cleanup(): void {
        this.CleanUpFn?.()
        this.CleanUpFn = null
    }

    private async loadVirtualInputs(): Promise<void> {
        var inputs = await this.virtualInputsLoader.loadVirtualInputs(this.gameDataProvider.Game.game.virtualInputs)
        inputs.forEach(input => {
            input.virtualKeys.forEach(virtualKey => this.gameDataProvider.Game.loadedVirtualInputs.set(virtualKey, input))
        })
    }
}
