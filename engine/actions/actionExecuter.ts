import { Token, token } from '@ioc/token'
import { Action, BaseAction } from '@loader/data/action'
import { ActionHandlerRegistry, actionHandlerRegistryToken } from '@registries/actionHandlerRegistry'
import { fatalError } from '@utils/logMessage'
import { Message } from '@utils/types'

export interface IActionExecuter {
    execute<T extends BaseAction = Action>(action: T, message?: Message, data?: unknown): void
}

const logName = 'ActionExecuter'
export const actionExecuterToken = token<IActionExecuter>(logName)
export const actionExecuterDependencies: Token<unknown>[] = [actionHandlerRegistryToken]
export class ActionExecuter implements IActionExecuter {
    constructor(private actionHandlerRegistry: ActionHandlerRegistry){}

    public execute<T extends BaseAction = Action>(action: T, message?: Message, data?: unknown): void {
        const actionHandler = this.actionHandlerRegistry.getActionHandler(action.type)
        if (!actionHandler) fatalError(logName, 'No action handler found for type {0}', action.type)
        actionHandler.handle(action, message, data)
    }
}
