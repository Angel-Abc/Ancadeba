import { Token, token } from '@ioc/token'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { runScript } from '@utils/runScript'
import { Message } from '@utils/types'

export interface IScriptService {
    /**
     * Executes a script within a sandboxed context.
     *
     * @template T Return type of the script.
     * @template U Type of data provided to the script.
     * @param {string} script Script source to execute.
     * @param {U} data Input made available to the script.
     * @returns {T} Value returned by the executed script.
     *
     * The script's context exposes the following fields:
     * - `game`: the current game data.
     * - `data`: the global game context.
     * - `postMessage(message)`: dispatches an engine message.
     *
     * If execution fails the script, context and data are logged before
     * rethrowing the error.
     */
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

    /**
     * Executes a script with the current game context.
     *
     * @template T Return type of the script.
     * @template U Type of data provided to the script.
     * @param {string} script Script source to execute.
     * @param {U} data Input made available to the script.
     * @returns {T} Value returned by the executed script.
     *
     * The script's context exposes:
     * - `game`: the current game data.
     * - `data`: the global game context.
     * - `postMessage(message)`: dispatches an engine message.
     *
     * If execution fails the script, context and data are logged before
     * rethrowing the error.
     */
    public runScript<T, U>(script: string, data: U): T {
        const postMessage = (message: Message<unknown>): void => {
            this.messageBus.postMessage(message)
        }

        const context = {
            game: this.gameDataProvider.game,
            data: this.gameDataProvider.context,
            postMessage: postMessage
        }
        try {
            return runScript<T>(script, context, data)
        } catch (error) {
            this.logger.error(logName, 'Failed script: {0}', script)
            this.logger.error(logName, 'context: {0}', context)
            this.logger.error(logName, 'data: {0}', data)
            throw error
        }

    }
}
