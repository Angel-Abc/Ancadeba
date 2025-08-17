import { Token, token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IInputsProvider } from '@registries/inputsProviderRegistry'

export type IPageInputsProvider = IInputsProvider

const logName = 'PageInputsProvider'
export const pageInputsProviderToken = token<IPageInputsProvider>(logName)
export const pageInputsProviderDependencies: Token<unknown>[] = [gameDataProviderToken]
export class PageInputsProvider implements IPageInputsProvider {

    constructor(private gameDataProvider: IGameDataProvider){}

    public isActive(): boolean {
        const currentPageId = this.gameDataProvider.Context.currentPageId
        if (!currentPageId) return false
        const currentPage = this.gameDataProvider.Game.loadedPages[currentPageId]
        if (currentPage) return true
        return false
    }

    public getInputs(): Input[] {
        const currentPageId = this.gameDataProvider.Context.currentPageId
        if (currentPageId) {
            const currentPage = this.gameDataProvider.Game.loadedPages[currentPageId]
            if (currentPage) {
                return currentPage.inputs
            }
        }
        return []       
    }
}
