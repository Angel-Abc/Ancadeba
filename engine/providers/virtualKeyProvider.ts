import { Token, token } from '@ioc/token'
import { IVirtualKeysLoader, virtualKeysLoaderToken } from '@loader/virtualKeysLoader'
import { IKeyboardEventListener, keyboardeventListenerToken } from '@utils/keyboardEventListener'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { gameDataProviderToken, IGameDataProvider } from './gameDataProvider'
import { VIRTUAL_INPUT } from '@messages/system'

export interface IVirtualKeyProvider {
    initialize(): Promise<void>
    cleanup(): void
}

const logName = 'VirtualKeyProvider'
export const virtualKeyProviderToken = token<IVirtualKeyProvider>(logName)
export const virtualKeyProviderDependencies: Token<unknown>[] = [
    keyboardeventListenerToken,
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

    public async initialize(): Promise<void> {
        if (this.gameDataProvider.Game.loadedVirtualKeys.size === 0) await this.loadVirtualKeys()
        this.CleanUpFn?.()
        this.CleanUpFn = this.keyboardEventListener.addListener(event => {
            const lookupKey = this.createKey(event.code, event.alt, event.ctrl, event.shift)
            if (this.gameDataProvider.Game.loadedVirtualKeys.has(lookupKey)){
                const virtualkey = this.gameDataProvider.Game.loadedVirtualKeys.get(lookupKey)
                this.messageBus.postMessage({
                    message: VIRTUAL_INPUT,
                    payload: virtualkey?.virtualKey
                })
            }
        })
    }

    public cleanup(): void {
        this.CleanUpFn?.()
        this.CleanUpFn = null
    }

    private async loadVirtualKeys(): Promise<void> {
        var keys = await this.virtualKeysLoader.loadVirtualKeys(this.gameDataProvider.Game.game.virtualKeys)
        keys.forEach(key => {
            const lookupKey = this.createKey(key.keyCode, key.alt, key.ctrl, key.shift)
            this.gameDataProvider.Game.loadedVirtualKeys.set(lookupKey, key)
        })
    }

    private createKey(code: string, alt: boolean, ctrl: boolean, shift: boolean): string {
        return `${code}-${alt}-${ctrl}-${shift}`
    }

}
