import { actionExecuterToken, IActionExecuter } from '@actions/actionExecuter'
import { Token, token } from '@ioc/token'
import { actionHandlersLoaderToken, IActionHandlersLoader } from '@loader/actionHandlersLoader'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

/**
 * Contract for components that manage loading and execution of game actions.
 */
export interface IActionManager {
    /**
     * Loads all available actions and wires them to the message bus.
     *
     * @returns A promise that resolves once all handlers are registered.
     */
    initialize(): Promise<void>

    /**
     * Unregisters any previously registered action handlers.
     */
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
/**
 * Default implementation of {@link IActionManager} that loads action
 * handlers based on game data and registers them with the message bus so
 * that incoming messages trigger the appropriate game actions.
 */
export class ActionManager implements IActionManager {
    private cleanupFns: CleanUp[] | null = null

    /**
     * Creates a new {@link ActionManager}.
     *
     * @param actionHandlersLoader - Loader responsible for discovering and
     * loading action handler modules.
     * @param messageBus - Message bus used to listen for action messages.
     * @param gameDataProvider - Provider that exposes game configuration data,
     * including available actions.
     * @param actionExecutor - Executes an action when its corresponding message
     * is received.
     */
    constructor(
        private actionHandlersLoader: IActionHandlersLoader,
        private messageBus: IMessageBus,
        private gameDataProvider: IGameDataProvider,
        private actionExecutor: IActionExecuter
    ) {}

    /**
     * Removes all registered action handlers from the message bus. Calling
     * this method more than once has no adverse effects.
     */
    cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())
    }

    /**
     * Loads action handlers described in the game data and registers each one
     * with the message bus so that they execute when the corresponding message
     * is received.
     */
    public async initialize(): Promise<void> {
        this.cleanup()
        const paths = this.gameDataProvider.Game.game.actions
        const handlers = await this.actionHandlersLoader.loadActions(paths)
        this.cleanupFns = handlers.map(handler => {
            return this.messageBus.registerMessageListener(
                handler.message,
                async message => {
                    this.actionExecutor.execute(handler.action, message)
                }
            )
        })
    }
}
