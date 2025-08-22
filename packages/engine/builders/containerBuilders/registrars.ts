import { token } from '@ioc/token'
import { IActionHandlerRegistry } from '@registries/actionHandlerRegistry'
import { IConditionResolverRegistry } from '@registries/conditionResolverRegistry'
import { IInputsProviderRegistry } from '@registries/inputsProviderRegistry'

export type ActionHandlerRegistrar = (registry: IActionHandlerRegistry) => void
export type ConditionResolverRegistrar = (registry: IConditionResolverRegistry) => void
export type InputsProviderRegistrar = (registry: IInputsProviderRegistry) => void

export const actionHandlerRegistrarsToken = token<ActionHandlerRegistrar[]>('action-handler-registrars')
export const conditionResolverRegistrarsToken = token<ConditionResolverRegistrar[]>('condition-resolver-registrars')
export const inputsProviderRegistrarsToken = token<InputsProviderRegistrar[]>('inputs-provider-registrars')
