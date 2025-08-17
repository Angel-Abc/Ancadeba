import { Token, token } from '@ioc/token'
import { Condition } from '@loader/data/condition'
import { conditionResolverRegistryToken, IConditionResolverRegistry } from '@registries/conditionResolverRegistry'
import { ILogger, loggerToken } from '@utils/logger'

export interface IConditionResolver {
    /**
     * Evaluates whether a given condition is satisfied.
     *
     * Accepts a {@link Condition} or `null`/`undefined`. When no condition is
     * provided the resolver defaults to returning `true`, indicating that the
     * absence of a condition imposes no restriction.
     *
     * @param condition - The condition to evaluate or `null`/`undefined`.
     * @returns `true` if the condition is met or when no condition is supplied.
     */
    resolve(condition: Condition | null | undefined): boolean
}

const logName = 'ConditionResolver'
export const conditionResolverToken = token<IConditionResolver>(logName)
export const conditionResolverDependencies: Token<unknown>[] = [conditionResolverRegistryToken, loggerToken]
export class ConditionResolver implements IConditionResolver {
    constructor (
        private conditionResolverRegistry: IConditionResolverRegistry,
        private logger: ILogger
    ){}

    /**
     * Resolves a condition by delegating to a registered resolver.
     *
     * When `condition` is `null` or `undefined` the method returns `true`. If a
     * condition is provided, its `type` is used to look up a matching resolver
     * from the {@link IConditionResolverRegistry}. The resolved handler's
     * `resolve` method is then invoked. If no resolver is found an error is
     * logged and thrown.
     *
     * @param condition - The condition to evaluate.
     * @returns The result of the delegated resolver or `true` when no condition is provided.
     * @throws Error If there is no resolver registered for the provided condition type.
     */
    public resolve(condition: Condition | null | undefined): boolean {
        if (!condition) return true
        const resolver = this.conditionResolverRegistry.getConditionResolver(condition.type)
        if (resolver) return resolver.resolve(condition)
        throw new Error(this.logger.error(logName, 'Could not resolve condition with type {0}', condition.type))
    }
}

