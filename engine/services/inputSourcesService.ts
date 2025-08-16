import { conditionResolverToken, IConditionResolver } from '@conditions/conditionResolver'
import { Token, token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { ActiveInput, gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'

export interface IInputSourcesService {
    updateInputs(): void
}

const logName = 'InputSourcesService'
export const inputSourcesServiceToken = token<IInputSourcesService>(logName)
export const inputSourcesServiceDependencies: Token<unknown>[] = [gameDataProviderToken, conditionResolverToken]
export class InputSourcesService implements IInputSourcesService {
    constructor(
        private gameDataProvider: IGameDataProvider,
        private conditionResolver: IConditionResolver
    ) {}

    public updateInputs(): void {
        // we use the game data and context to determine where to get the inputs
        // at this moment, only the page can provide inputs
        const activeInputs: ActiveInput[] = [
            ...this.getCurrentPageInputs().map(input => this.resolveConditions(input))
        ]
        this.gameDataProvider.Game.activeInputs = activeInputs
    }

    private getCurrentPageInputs(): Input[] {
        const currentPageId = this.gameDataProvider.Context.currentPageId
        if (currentPageId) {
            const currentPage = this.gameDataProvider.Game.loadedPages[currentPageId]
            if (currentPage) {
                return currentPage.inputs
            }
        }
        return []
    }

    private resolveConditions(input: Input): ActiveInput {
        return {
            input: input,
            enabled: this.conditionResolver.resolve(input.enabled),
            visible: this.conditionResolver.resolve(input.visible)
        }
    }
}
