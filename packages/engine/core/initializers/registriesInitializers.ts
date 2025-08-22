import { Token, token } from '@ioc/token'
import { IInitializer } from './engineInitializer'
import { actionHandlerRegistryToken, IActionHandlerRegistry } from '@registries/actionHandlerRegistry'
import { ActionHandlerRegistrar, actionHandlerRegistrarsToken, ConditionResolverRegistrar, conditionResolverRegistrarsToken, InputsProviderRegistrar, inputsProviderRegistrarsToken } from '@builders/containerBuilders/registrars'
import { IInputsProviderRegistry, inputsProviderRegistryToken } from '@registries/inputsProviderRegistry'
import { ConditionResolverRegistry, conditionResolverRegistryToken } from '@registries/conditionResolverRegistry'

export type IRegistriesInitializer = IInitializer

const logName = 'RegistriesInitializer'
export const registriesInitializerToken = token<IRegistriesInitializer>(logName)
export const registriesInitializerDependencies: Token<unknown>[] = [
    actionHandlerRegistrarsToken,
    actionHandlerRegistryToken,
    inputsProviderRegistrarsToken,
    inputsProviderRegistryToken,
    conditionResolverRegistrarsToken,
    conditionResolverRegistryToken
]
export class RegistriesInitializer implements IRegistriesInitializer {
    constructor(
        private actionHandlerRegistrars: ActionHandlerRegistrar[],
        private actionHandlerRegistry: IActionHandlerRegistry,
        private inputsProviderRegistrars: InputsProviderRegistrar[],
        private inputsProviderRegistry: IInputsProviderRegistry,
        private conditionResolverRegistrars: ConditionResolverRegistrar[],
        private conditionResolverRegistry: ConditionResolverRegistry
    ){}

    public async initialize(): Promise<void> {
        this.actionHandlerRegistrars.forEach(r => r(this.actionHandlerRegistry))
        this.inputsProviderRegistrars.forEach(r => r(this.inputsProviderRegistry))
        this.conditionResolverRegistrars.forEach(r => r(this.conditionResolverRegistry))
    }
}
