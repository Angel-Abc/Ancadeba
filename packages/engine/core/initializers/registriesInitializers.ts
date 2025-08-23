import { Token, token } from '@ioc/token'
import { IInitializer } from './engineInitializer'
import { actionHandlerRegistryToken, IActionHandlerRegistry } from '@registries/actionHandlerRegistry'
import { ActionHandlerRegistrar, actionHandlerRegistrarsToken, ConditionResolverRegistrar, conditionResolverRegistrarsToken, InputsProviderRegistrar, inputsProviderRegistrarsToken } from '@builders/containerBuilders/registrars'
import { IInputsProviderRegistry, inputsProviderRegistryToken } from '@registries/inputsProviderRegistry'
import { ConditionResolverRegistry, conditionResolverRegistryToken } from '@registries/conditionResolverRegistry'

/**
 * Initializes registries by executing their respective registrar callbacks.
 */
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
/**
 * Executes registrar functions to populate runtime registries.
 * Each registrar is called with its corresponding registry producing
 * side effects that register handlers and resolvers.
 */
export class RegistriesInitializer implements IRegistriesInitializer {
    /**
     * @param actionHandlerRegistrars Functions that register action handlers.
     * @param actionHandlerRegistry Registry receiving action handlers.
     * @param inputsProviderRegistrars Functions registering input providers.
     * @param inputsProviderRegistry Registry of input providers.
     * @param conditionResolverRegistrars Functions registering condition resolvers.
     * @param conditionResolverRegistry Registry of condition resolvers.
     */
    constructor(
        private actionHandlerRegistrars: ActionHandlerRegistrar[],
        private actionHandlerRegistry: IActionHandlerRegistry,
        private inputsProviderRegistrars: InputsProviderRegistrar[],
        private inputsProviderRegistry: IInputsProviderRegistry,
        private conditionResolverRegistrars: ConditionResolverRegistrar[],
        private conditionResolverRegistry: ConditionResolverRegistry
    ){}

    /**
     * Invokes each registrar to populate its associated registry.
     */
    public async initialize(): Promise<void> {
        this.actionHandlerRegistrars.forEach(r => r(this.actionHandlerRegistry))
        this.inputsProviderRegistrars.forEach(r => r(this.inputsProviderRegistry))
        this.conditionResolverRegistrars.forEach(r => r(this.conditionResolverRegistry))
    }
}
