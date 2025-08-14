import { actionExecuterToken, IActionExecuter } from '@actions/actionExecuter'
import { Token, token } from '@ioc/token'
import { actionHandlersLoaderToken, IActionHandlersLoader } from '@loader/actionHandlersLoader'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface IActionManager {
    initialize(): Promise<void>
    cleanup(): void
}

const logName = 'ActionManager'
export const actionManagerToken = token<IActionManager>(logName)
export const actionManagerDependencies: Token<unknown>[] = [
    actionHandlersLoaderToken, 
    messageBusToken, 
    gameDataProviderToken,
    actionExecuterToken
]
export class ActionManager implements IActionManager {
    private cleanupFns: CleanUp[] | null = null

    constructor(
        private actionHandlersLoader: IActionHandlersLoader, 
        private messageBus: IMessageBus, 
        private gameDataProvider: IGameDataProvider,
        private actionExecutor: IActionExecuter
    ) {}
    
    cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())
    }

    public async initialize(): Promise<void> {
        const paths = this.gameDataProvider.Game.game.actions
        const handlers = await this.actionHandlersLoader.loadActions(paths)
        this.cleanupFns = handlers.map(handler => {
            return this.messageBus.registerMessageListener(
                handler.message, 
                message => {
                    this.actionExecutor.execute(handler.action, message)
                }
            )
        })
    }
}
