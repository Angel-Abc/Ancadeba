import { Token, token } from '@ioc/token'
import { IVirtualInputsLoader, virtualInputsLoaderToken } from '@loader/virtualInputsLoader'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { gameDataProviderToken, IGameDataProvider } from './gameDataProvider'
import { CleanUp } from '@utils/types'
import { VIRTUAL_INPUT, VIRTUAL_KEY } from '@messages/system'

/**
 * Provides access to the game's virtual inputs and manages the lifecycle of
 * the underlying message listeners.
 *
 * - `initialize` loads the virtual input configuration and registers a
 *   listener so that virtual key messages are translated into virtual input
 *   events.
 * - `cleanup` unregisters the listener and releases any resources created
 *   during initialization.
 */
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

    /**
     * Called during engine startup to prepare the virtual input system.
     * Loads virtual inputs on first use and registers a message listener that
     * converts virtual key messages into virtual input messages.
     *
     * Side effects include populating the `loadedVirtualInputs` map and
     * storing a cleanup function for later disposal.
     */
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

    /**
     * Releases resources acquired during initialization by unregistering the
     * message listener and clearing the stored cleanup function.
     */
    public cleanup(): void {
        this.CleanUpFn?.()
        this.CleanUpFn = null
    }

    /**
     * Loads virtual input definitions and populates the
     * `loadedVirtualInputs` map with the corresponding mappings. Mutates the
     * game data provider's state.
     */
    private async loadVirtualInputs(): Promise<void> {
        var inputs = await this.virtualInputsLoader.loadVirtualInputs(this.gameDataProvider.Game.game.virtualInputs)
        inputs.forEach(input => {
            input.virtualKeys.forEach(virtualKey => this.gameDataProvider.Game.loadedVirtualInputs.set(virtualKey, input))
        })
    }
}
