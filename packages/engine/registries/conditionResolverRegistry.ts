/**
 * Manages condition resolver implementations, allowing them to be registered and
 * retrieved by the condition type they support.
 */
import { token, Token } from '@ioc/token'
import { Condition } from '@loader/data/condition'
import { IServiceProvider, serviceProviderToken } from '@providers/serviceProvider'

/**
 * Contract for a service that can determine whether a specific condition is met.
 */
export interface IConditionResolver {
    readonly type: Condition['type'],
    /**
     * Evaluates the given condition.
     * @param condition - The condition to check.
     * @returns True when the condition is satisfied; otherwise, false.
     */
    resolve(condition: Condition): boolean
}

/**
 * Registry for managing condition resolvers.
 */
export interface IConditionResolverRegistry {
    /**
     * Registers a resolver for the specified condition type.
     * @param type - The type of condition the resolver supports.
     * @param resolverToken - Token pointing to the resolver implementation.
     */
    registerConditionResolver(type: Condition['type'], resolverToken: Token<IConditionResolver>): void
    /**
     * Retrieves the resolver associated with the provided type.
     * @param type - Condition type whose resolver is requested.
     * @returns The registered resolver or `undefined` if none exists.
     */
    getConditionResolver(type: Condition['type']): IConditionResolver | undefined,
    /**
     * Removes all registered resolvers.
     */
    clear(): void
}

const logName = 'ConditionResolverRegistry'
export const conditionResolverRegistryToken = token<IConditionResolverRegistry>(logName)
export const conditionResolverRegistryDependencies: Token<unknown>[] = [serviceProviderToken]

/**
 * Default implementation of {@link IConditionResolverRegistry} using a map
 * backed by a service provider to instantiate resolvers.
 */
export class ConditionResolverRegistry implements IConditionResolverRegistry {
    private readonly registry = new Map<string, Token<IConditionResolver>>()

    /**
     * Creates a new registry.
     * @param serviceProvider - Provider used to resolve resolver instances.
     */
    constructor(private serviceProvider: IServiceProvider) {}

    /**
     * {@inheritDoc IConditionResolverRegistry.registerConditionResolver}
     */
    public registerConditionResolver(type: Condition['type'], resolverToken: Token<IConditionResolver>): void {
        this.registry.set(type, resolverToken)
    }

    /**
     * {@inheritDoc IConditionResolverRegistry.getConditionResolver}
     */
    public getConditionResolver(type: Condition['type']): IConditionResolver | undefined {
        const token = this.registry.get(type)
        return token ? (this.serviceProvider.getService(token) as unknown as IConditionResolver) : undefined
    }

    /**
     * {@inheritDoc IConditionResolverRegistry.clear}
     */
    public clear(): void {
        this.registry.clear()
    }
}

