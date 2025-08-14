import { Action, BaseAction } from '@loader/data/action'
import { Message } from '@utils/types'
import { token, type Token } from '@ioc/token'
import { serviceProviderToken, type IServiceProvider } from '@providers/serviceProvider'

/**
 * Represents a handler for a specific {@link Action} type.
 *
 * Individual handlers will implement this interface and are registered using
 * {@link ActionHandlerRegistry.registerActionHandler}. The registry keeps a mapping of an action
 * type to the IoC {@link Token} of its handler. When an instance is required
 * the token is resolved via the {@link IServiceProvider}.
 */
export interface IActionHandler<T extends BaseAction = Action> {
    /** The action type this handler is responsible for. */
    readonly type: T['type']
    /**
     * Handles the provided action.
     *
     * @param action - The action instance to handle
     * @param message - Optional message context
     * @param data - Optional additional data
     */
    handle(action: T, message?: Message, data?: unknown): void
}

// ---------------------------------------------------------------------------
// Registry implementation

/**
 * Registry responsible for mapping action types to handler tokens and
 * resolving handler instances via an {@link IServiceProvider}.
 */
export interface IActionHandlerRegistry {
    registerActionHandler<T extends BaseAction>(type: T['type'], handlerToken: Token<IActionHandler<T>>): void
    getActionHandler<T extends BaseAction>(type: T['type']): IActionHandler<T> | undefined
    clear(): void
}

const logName = 'ActionHandlerRegistry'
export const actionHandlerRegistryToken = token<IActionHandlerRegistry>(logName)
export const actionHandlerRegistryDependencies: Token<unknown>[] = [serviceProviderToken]
export class ActionHandlerRegistry implements IActionHandlerRegistry {
    private readonly registry = new Map<string, Token<IActionHandler>>()

    constructor(private serviceProvider: IServiceProvider) {}

    /**
     * Registers an action handler token for a given action type.
     *
     * @param type - The action type handled by the token
     * @param handlerToken - IoC token used to resolve the handler
     */
    public registerActionHandler<T extends BaseAction>(
        type: T['type'],
        handlerToken: Token<IActionHandler<T>>
    ): void {
        this.registry.set(type, handlerToken as Token<IActionHandler>)
    }

    /**
     * Resolves an action handler instance for the specified action type.
     *
     * @param type - The action type to resolve a handler for
     * @param serviceProvider - Service provider used to resolve the handler
     * @returns The handler instance or `undefined` if no handler is registered
     */
    public getActionHandler<T extends BaseAction>(
        type: T['type']
    ): IActionHandler<T> | undefined {
        const token = this.registry.get(type)
        return token ? (this.serviceProvider.getService(token) as unknown as IActionHandler<T>) : undefined
    }

    /** Clears all registered handlers. */
    public clear(): void {
        this.registry.clear()
    }
}
