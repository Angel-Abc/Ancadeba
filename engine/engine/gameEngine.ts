import { Token, token } from '@ioc/token'
import { logDebug } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'

const LogName: string = 'GameEngine'

export interface IGameEngine {
    start(): Promise<void>
}
export const gameEngineToken = token<IGameEngine>('GameEngine')
export const gameEngineDependencies: Token<unknown>[] = [messageBusToken]
export class GameEngine implements IGameEngine {
    private messageBus: IMessageBus

    constructor(messageBus: IMessageBus) {
        this.messageBus = messageBus
    }

    async start(): Promise<void> {
        logDebug(LogName, 'Starting game engine...')
        // Initialize game engine logic here
    }
}
