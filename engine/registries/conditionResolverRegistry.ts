import { token, Token } from '@ioc/token'
import { Condition } from '@loader/data/condition'
import { IServiceProvider, serviceProviderToken } from '@providers/serviceProvider'

export interface IConditionResolver {
    readonly type: Condition['type'],
    resolve(condition: Condition): boolean
}

export interface IConditionResolverRegistry {
    registerConditionResolver(type: Condition['type'], resolverToken: Token<IConditionResolver>): void
    getConditionResolver(type: Condition['type']): IConditionResolver | undefined,
    clear(): void
}

const logName = 'ConditionResolverRegistry'
export const conditionResolverRegistryToken = token<IConditionResolverRegistry>(logName)
export const conditionResolverRegistryDependencies: Token<unknown>[] = [serviceProviderToken]
export class ConditionResolverRegistry implements IConditionResolverRegistry {
    private readonly registry = new Map<string, Token<IConditionResolver>>()

    constructor(private serviceProvider: IServiceProvider) {}

    public registerConditionResolver(type: Condition['type'], resolverToken: Token<IConditionResolver>): void {
        this.registry.set(type, resolverToken)
    }

    public getConditionResolver(type: Condition['type']): IConditionResolver | undefined {
        const token = this.registry.get(type)
        return token ? (this.serviceProvider.getService(token) as unknown as IConditionResolver) : undefined
    }

    public clear(): void {
        this.registry.clear()
    }
}

