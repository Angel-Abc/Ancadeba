import { GAME_DATA_STORE_CHANGED } from '@editor/messages/editor'
import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'

export interface IGameDataStoreProvider {
    store<T>(id: number, data: T): void
    update<T>(id: number, data: T): void
    retrieve<T>(id: number): T
    get IsChanged(): boolean
}

interface StoreItem<T> {
    Original: T
    current: T
}

const logName = 'GameDataStoreProvider'
export const gameDataStoreProviderToken = token<IGameDataStoreProvider>(logName)
export const gameDataStoreProviderDependencies: Token<unknown>[] = [
    loggerToken,
    messageBusToken
]
export class GameDataStoreProvider implements IGameDataStoreProvider {
    private isChanged: boolean = false
    private items: Map<number, StoreItem<unknown>> = new Map<number, StoreItem<unknown>>()
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus
    ) { }

    public get IsChanged(): boolean {
        return this.isChanged
    }

    public store<T>(id: number, data: T): void {
        if (this.items.has(id)) {
            this.logger.warn(logName, 'Overwriting stored item with id {0}', id)
        }
        this.items.set(id, {
            Original: data,
            current: data
        })
        this.messageBus.postMessage({
            message: GAME_DATA_STORE_CHANGED,
            payload: id
        })
    }

    public update<T>(id: number, data: T): void {
        if (this.items.has(id)) {
            const item = this.items.get(id)!
            item.current = data
            this.isChanged = true
            this.messageBus.postMessage({
                message: GAME_DATA_STORE_CHANGED,
                payload: id
            })
        } else {
            this.logger.warn(logName, 'Trying to update an invalid stored item with id {0}', id)
        }
    }

    public retrieve<T>(id: number): T {
        if (this.items.has(id)) {
            const item = this.items.get(id)!
            return item.current as T
        }
        const error = this.logger.error(logName, 'Game item with id {0} not found in store', id)
        throw new Error(error)
    }
}
