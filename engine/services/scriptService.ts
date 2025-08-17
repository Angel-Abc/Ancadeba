import { Token, token } from '@ioc/token'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { ILogger, loggerToken } from '@utils/logger'
import { runScript } from '@utils/runScript'

export interface IScriptService {
    runScript<T, U>(script: string, data: U): T
}

const logName = 'ScriptService'
export const scriptServiceToken = token<IScriptService>(logName)
export const scriptServiceDependencies: Token<unknown>[] = [gameDataProviderToken, loggerToken]
export class ScriptService implements IScriptService {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private logger: ILogger
    ){}

    public runScript<T, U>(script: string, data: U): T {
        const context = {
            game: this.gameDataProvider.Game,
            data: this.gameDataProvider.Context
        }
        try {
            return runScript<T>(script, context, data)
        } catch (error) {
            this.logger.info(logName, 'Failed script: {0}', script)
            throw error
        }

    }
}
