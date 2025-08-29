import { Token, token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IInputsProvider } from '@registries/inputsProviderRegistry'

export type IPageInputs = IInputsProvider

const logName = 'PageInputs'
export const pageInputsToken = token<IPageInputs>(logName)
export const pageInputsDependencies: Token<unknown>[] = [gameDataProviderToken]
export class PageInputs implements IPageInputs {

    constructor(private gameDataProvider: IGameDataProvider){}

    public isActive(): boolean {
        const currentPageId = this.gameDataProvider.context.currentPageId
        if (!currentPageId) return false
        const currentPage = this.gameDataProvider.game.loadedPages[currentPageId]
        if (currentPage) return true
        return false
    }

    public getInputs(): Input[] {
        const currentPageId = this.gameDataProvider.context.currentPageId
        if (currentPageId) {
            const currentPage = this.gameDataProvider.game.loadedPages[currentPageId]
            if (currentPage) {
                return currentPage.inputs
            }
        }
        return []       
    }
}
