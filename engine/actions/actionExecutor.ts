import { Token, token } from '@ioc/token'
import { Action, BaseAction } from '@loader/data/action'
import { ActionHandlerRegistry, actionHandlerRegistryToken } from '@registries/actionHandlerRegistry'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { Message } from '@utils/types'

/**
 * Executes actions using registered action handlers.
 */
export interface IActionExecutor {
    /**
     * Executes the provided action by resolving and invoking its handler.
     *
     * @param action - The action to execute.
     * @param message - Optional message that triggered the action.
     * @param data - Additional data forwarded to the handler.
     * @throws Error if no handler is registered for the action type.
     */
    execute<T extends BaseAction = Action>(action: T, message?: Message, data?: unknown): void
}

const logName = 'ActionExecutor'
export const actionExecutorToken = token<IActionExecutor>(logName)
export const actionExecutorDependencies: Token<unknown>[] = [actionHandlerRegistryToken, loggerToken]

/**
 * Default implementation of {@link IActionExecutor} that delegates work to
 * action handlers resolved from a registry.
 */
export class ActionExecutor implements IActionExecutor {
    /**
     * Creates a new {@link ActionExecutor}.
     *
     * @param actionHandlerRegistry - Registry used to look up action handlers.
     * @param logger - Logger used to report errors.
     */
    constructor(private actionHandlerRegistry: ActionHandlerRegistry, private logger: ILogger){}

    /**
     * Executes the given action by invoking its associated handler.
     *
     * @param action - Action instance to execute.
     * @param message - Optional message that led to the action.
     * @param data - Supplementary data passed to the handler.
     * @throws Error if no handler exists for the action type.
     */
    public execute<T extends BaseAction = Action>(action: T, message?: Message, data?: unknown): void {
        const actionHandler = this.actionHandlerRegistry.getActionHandler(action.type)
        if (!actionHandler) {
            this.logger.error(logName, 'No action handler found for type {0}', action.type)
            throw new Error(`No action handler found for type ${action.type}`)
        }
        actionHandler.handle(action, message, data)
    }
}
