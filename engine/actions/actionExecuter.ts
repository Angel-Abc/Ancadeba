import { Token, token } from '@ioc/token'
import { Action, BaseAction } from '@loader/data/action'
import { ActionHandlerRegistry, actionHandlerRegistryToken } from '@registries/actionHandlerRegistry'
import { fatalError } from '@utils/logMessage'
import { Message } from '@utils/types'

/**
 * Executes actions using registered action handlers.
 */
export interface IActionExecuter {
    /**
     * Executes the provided action by resolving and invoking its handler.
     *
     * @param action - The action to execute.
     * @param message - Optional message that triggered the action.
     * @param data - Additional data forwarded to the handler.
     * @throws {@link fatalError} if no handler is registered for the action type.
     */
    execute<T extends BaseAction = Action>(action: T, message?: Message, data?: unknown): void
}

const logName = 'ActionExecuter'
export const actionExecuterToken = token<IActionExecuter>(logName)
export const actionExecuterDependencies: Token<unknown>[] = [actionHandlerRegistryToken]

/**
 * Default implementation of {@link IActionExecuter} that delegates work to
 * action handlers resolved from a registry.
 */
export class ActionExecuter implements IActionExecuter {
    /**
     * Creates a new {@link ActionExecuter}.
     *
     * @param actionHandlerRegistry - Registry used to look up action handlers.
     */
    constructor(private actionHandlerRegistry: ActionHandlerRegistry){}

    /**
     * Executes the given action by invoking its associated handler.
     *
     * @param action - Action instance to execute.
     * @param message - Optional message that led to the action.
     * @param data - Supplementary data passed to the handler.
     * @throws {@link fatalError} if no handler exists for the action type.
     */
    public execute<T extends BaseAction = Action>(action: T, message?: Message, data?: unknown): void {
        const actionHandler = this.actionHandlerRegistry.getActionHandler(action.type)
        if (!actionHandler) fatalError(logName, 'No action handler found for type {0}', action.type)
        actionHandler.handle(action, message, data)
    }
}
