import { dataUrlToken } from '@editor/builders/containerBuilders/staticDataTokens'
import { gameModelToken, IGameModelSet } from '@editor/model/GameModel'
import { IPagesModelSet, pagesModelToken } from '@editor/model/PagesModel'
import { Token, token } from '@ioc/token'
import { Page, pageSchema } from '@loader/schema/page'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'

export interface IPagesLoader {
    load(): Promise<void>
}

const logName = 'PagesLoader'
export const pagesLoaderToken = token<IPagesLoader>(logName)
export const pagesLoaderDependencies: Token<unknown>[] = [
    dataUrlToken,
    loggerToken,
    gameModelToken,
    pagesModelToken
]

export class PagesLoader implements IPagesLoader {
    constructor(
        private dataUrl: string,
        private logger: ILogger,
        private gameModel: IGameModelSet,
        private pagesModel: IPagesModelSet
    ) {}

    public async load(): Promise<void> {
        const game = this.gameModel.game
        const entries = Object.entries(game.pages)
        const pageIds = entries.map(([id]) => id).sort()
        this.pagesModel.setAvailablePages(pageIds)

        const promises: Promise<void>[] = []
        entries.forEach(([id, file]) => {
            const path = `${this.dataUrl}/${file}`
            const loader = async (): Promise<void> => {
                const page = await loadJsonResource<Page>(path, pageSchema, this.logger)
                this.pagesModel.setPage(id, file, page)
            }
            promises.push(loader())
        })
        await Promise.all(promises)
    }
}

