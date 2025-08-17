import { conditionResolverToken, IConditionResolver } from '@conditions/conditionResolver'
import { Token, token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { ActiveInput, gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IInputsProviderRegistry, inputsProviderRegistryToken } from '@registries/inputsProviderRegistry'

export interface IInputSourcesService {
    updateInputs(): void
}

const logName = 'InputSourcesService'
export const inputSourcesServiceToken = token<IInputSourcesService>(logName)
export const inputSourcesServiceDependencies: Token<unknown>[] = [gameDataProviderToken, conditionResolverToken, inputsProviderRegistryToken]
export class InputSourcesService implements IInputSourcesService {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private conditionResolver: IConditionResolver,
        private inputsProviderRegistry: IInputsProviderRegistry
    ) {}

    public updateInputs(): void {
        const inputs: Input[] = []
        this.inputsProviderRegistry.getInputsProviders().forEach(inputsProvider => {
            if (inputsProvider.isActive()) {
                inputsProvider.getInputs().forEach(input => inputs.push(input))
            }
        })
        const activeInputs: ActiveInput[] = inputs.map(input => this.resolveConditions(input))
        this.gameDataProvider.Game.activeInputs = activeInputs
    }

    private resolveConditions(input: Input): ActiveInput {
        return {
            input: input,
            enabled: this.conditionResolver.resolve(input.enabled),
            visible: this.conditionResolver.resolve(input.visible)
        }
    }
}
