import { Token, token } from '@ioc/token'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { runScript } from '@utils/runScript'
import { Message } from '@utils/types'

export interface IScriptService {
    runScript<T, U>(script: string, data: U): T
}

const logName = 'ScriptService'
export const scriptServiceToken = token<IScriptService>(logName)
export const scriptServiceDependencies: Token<unknown>[] = [gameDataProviderToken, loggerToken,messageBusToken]
export class ScriptService implements IScriptService {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private logger: ILogger,
        private messageBus: IMessageBus
    ){}

    public runScript<T, U>(script: string, data: U): T {
        const postMessage = (message: Message<unknown>): void => {
            this.messageBus.postMessage(message)
        }

        const context = {
            game: this.gameDataProvider.Game,
            data: this.gameDataProvider.Context,
            postMessage: postMessage
        }
        try {
            return runScript<T>(script, context, data)
        } catch (error) {
            this.logger.info(logName, 'Failed script: {0}', script)
            this.logger.info(logName, 'context: {0}', context)
            this.logger.info(logName, 'data: {0}', data)
            throw error
        }

    }
}
