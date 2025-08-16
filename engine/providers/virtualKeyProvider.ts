import { Token, token } from '@ioc/token'
import { IVirtualKeysLoader, virtualKeysLoaderToken } from '@loader/virtualKeysLoader'
import { IKeyboardEventListener, keyboardEventListenerToken } from '@utils/keyboardEventListener'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { gameDataProviderToken, IGameDataProvider } from './gameDataProvider'
import { VIRTUAL_KEY } from '@messages/system'

/**
 * Translates physical keyboard input into virtual input messages.
 *
 * Methods:
 * - `initialize`: Load virtual key mappings and register keyboard listeners.
 * - `cleanup`: Remove registered listeners and release resources.
 */
export interface IVirtualKeyProvider {
    /**
     * Load virtual key mappings and register keyboard listeners.
     */
    initialize(): Promise<void>
    /**
     * Remove registered listeners and release resources.
     */
    cleanup(): void
}

const logName = 'VirtualKeyProvider'
export const virtualKeyProviderToken = token<IVirtualKeyProvider>(logName)
export const virtualKeyProviderDependencies: Token<unknown>[] = [
    keyboardEventListenerToken,
    messageBusToken,
    virtualKeysLoaderToken,
    gameDataProviderToken
]
export class VirtualKeyProvider implements IVirtualKeyProvider {
    private CleanUpFn: CleanUp | null = null

    constructor(
        private keyboardEventListener: IKeyboardEventListener,
        private messageBus: IMessageBus,
        private virtualKeysLoader: IVirtualKeysLoader,
        private gameDataProvider: IGameDataProvider
    ) { }

    /**
     * Initializes the provider by loading virtual key mappings if necessary and
     * registering a keyboard listener to translate physical input into virtual
     * input messages.
     *
     * Side effects:
     * - Populates the `loadedVirtualKeys` map on the game data provider when empty.
     * - Registers a keyboard event listener and stores a cleanup function.
     * - Posts virtual input messages to the message bus when keys are pressed.
     *
     * @returns {Promise<void>} Resolves when initialization is complete.
     */
    public async initialize(): Promise<void> {
        if (this.gameDataProvider.Game.loadedVirtualKeys.size === 0) await this.loadVirtualKeys()
        this.CleanUpFn?.()
        this.CleanUpFn = this.keyboardEventListener.addListener(event => {
            const lookupKey = this.createKey(event.code, event.alt, event.ctrl, event.shift)
            if (this.gameDataProvider.Game.loadedVirtualKeys.has(lookupKey)){
                const virtualkey = this.gameDataProvider.Game.loadedVirtualKeys.get(lookupKey)
                this.messageBus.postMessage({
                    message: VIRTUAL_KEY,
                    payload: virtualkey?.virtualKey
                })
            }
        })
    }

    /**
     * Cleans up resources by removing the registered keyboard listener.
     *
     * Side effects:
     * - Invokes the stored cleanup function for the keyboard listener.
     * - Clears the internal reference to the cleanup function.
     */
    public cleanup(): void {
        this.CleanUpFn?.()
        this.CleanUpFn = null
    }

    /**
     * Loads virtual key configurations into the game data provider.
     *
     * Side effects:
     * - Mutates the `loadedVirtualKeys` map with newly loaded key mappings.
     *
     * @returns {Promise<void>} Resolves once all virtual key data has been loaded.
     */
    private async loadVirtualKeys(): Promise<void> {
        var keys = await this.virtualKeysLoader.loadVirtualKeys(this.gameDataProvider.Game.game.virtualKeys)
        keys.forEach(key => {
            const lookupKey = this.createKey(key.keyCode, key.alt, key.ctrl, key.shift)
            this.gameDataProvider.Game.loadedVirtualKeys.set(lookupKey, key)
        })
    }

    /**
     * Creates a unique lookup key for a virtual key mapping.
     *
     * @param {string} code - Keyboard event code.
     * @param {boolean} alt - Indicates whether the Alt modifier is pressed.
     * @param {boolean} ctrl - Indicates whether the Control modifier is pressed.
     * @param {boolean} shift - Indicates whether the Shift modifier is pressed.
     * @returns {string} A compound key used to identify a virtual key mapping.
     */
    private createKey(code: string, alt: boolean, ctrl: boolean, shift: boolean): string {
        return `${code}-${alt}-${ctrl}-${shift}`
    }

}
