import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'

export interface IGameDataStoreProvider {
    store<T>(id: number, data: T): void
    retrieve<T>(id: number): T
}

interface StoreItem<T> {
    Original: T
    current: T
}

const logName = 'GameDataStoreProvider'
export const gameDataStoreProviderToken = token<IGameDataStoreProvider>(logName)
export const gameDataStoreProviderDependencies: Token<unknown>[] = [
    loggerToken
]
export class GameDataStoreProvider implements IGameDataStoreProvider {
    private items: Map<number, StoreItem<unknown>> = new Map<number, StoreItem<unknown>>()
    constructor(
        private logger: ILogger
    ){}

    public store<T>(id: number, data: T): void {
        if (this.items.has(id)){
            const item = this.items.get(id)!
            item.current = data
        } else {
            this.items.set(id, {
                Original: data,
                current: data
            })
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
