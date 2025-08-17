import { Container } from '@ioc/container'
import { ActionHandlerRegistry, actionHandlerRegistryDependencies, actionHandlerRegistryToken } from '@registries/actionHandlerRegistry'
import { ConditionResolverRegistry, conditionResolverRegistryDependencies, conditionResolverRegistryToken } from '@registries/conditionResolverRegistry'
import { ComponentRegistry, componentRegistryDependencies, componentRegistryToken } from '@registries/componentRegistry'
import { InputsProviderRegistry, inputsProviderRegistryDependencies, inputsProviderRegistryToken } from '@registries/inputsProviderRegistry'

/**
 * Registers dynamic registries for actions, components and conditions.
 */
export class RegistriesBuilder {
  /**
   * Register registry dependencies into the container.
   */
  register(container: Container): void {
    container.register({
      token: actionHandlerRegistryToken,
      useClass: ActionHandlerRegistry,
      deps: actionHandlerRegistryDependencies
    })
    container.register({
      token: conditionResolverRegistryToken,
      useClass: ConditionResolverRegistry,
      deps: conditionResolverRegistryDependencies
    })
    container.register({
      token: componentRegistryToken,
      useClass: ComponentRegistry,
      deps: componentRegistryDependencies
    })
    container.register({
      token: inputsProviderRegistryToken,
      useClass: InputsProviderRegistry,
      deps: inputsProviderRegistryDependencies
    })
  }
}

