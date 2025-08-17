import { conditionResolverToken, IConditionResolver } from '@conditions/conditionResolver'
import { Token, token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { ActiveInput, gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IInputsProviderRegistry, inputsProviderRegistryToken } from '@registries/inputsProviderRegistry'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'

export interface IInputSourcesService {
    updateInputs(): void
}

const logName = 'InputSourcesService'
export const inputSourcesServiceToken = token<IInputSourcesService>(logName)
export const inputSourcesServiceDependencies: Token<unknown>[] = [gameDataProviderToken, conditionResolverToken, inputsProviderRegistryToken, loggerToken]
/**
 * Service responsible for gathering inputs from active providers and updating
 * the game's collection of active inputs.
 */
export class InputSourcesService implements IInputSourcesService {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private conditionResolver: IConditionResolver,
        private inputsProviderRegistry: IInputsProviderRegistry,
        private logger: ILogger
    ) {}

    /**
     * Aggregates inputs from all active input providers, evaluates their
     * enabled and visible conditions, and updates the game's
     * {@link Game.activeInputs} map with the resolved values.
     */
    public updateInputs(): void {
        const activeInputs = new Map<string, ActiveInput>()
        this.inputsProviderRegistry.getInputsProviders().forEach(inputsProvider => {
            if (!inputsProvider.isActive()) return
            inputsProvider.getInputs().forEach(input => {
                if (activeInputs.has(input.virtualInput)) {
                    this.logger.warn(logName, 'Duplicate input for virtualInput {0}', input.virtualInput)
                }
                activeInputs.set(input.virtualInput, this.resolveConditions(input))
            })
        })
        this.gameDataProvider.Game.activeInputs = activeInputs
    }

    /**
     * Resolves the `enabled` and `visible` conditions for the provided input
     * using the configured {@link IConditionResolver}.
     *
     * @param input The input definition whose conditions should be evaluated.
     * @returns The resulting {@link ActiveInput} reflecting the input's enabled
     * and visible states.
     */
    private resolveConditions(input: Input): ActiveInput {
        return {
            input: input,
            enabled: this.conditionResolver.resolve(input.enabled),
            visible: this.conditionResolver.resolve(input.visible)
        }
    }
}
