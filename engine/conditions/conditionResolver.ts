import { Token, token } from '@ioc/token'
import { Condition } from '@loader/data/condition'
import { conditionResolverRegistryToken, IConditionResolverRegistry } from '@registries/conditionResolverRegistry'
import { ILogger, loggerToken } from '@utils/logger'

export interface IConditionResolver {
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

    public resolve(condition: Condition | null | undefined): boolean {
        if (!condition) return true
        const resolver = this.conditionResolverRegistry.getConditionResolver(condition.type)
        if (resolver) return resolver.resolve(condition)
        throw new Error(this.logger.error(logName, 'Could not resolve condition with type {0}', condition.type))
    }
}

