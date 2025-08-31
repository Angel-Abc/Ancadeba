import { dataUrlToken } from '@editor/builders/containerBuilders/staticDataTokens'
import { gameModelToken, IGameModelSet } from '@editor/model/GameModel'
import { ILanguagesModelSet, languagesModelToken } from '@editor/model/LanguagesModel'
import { Token, token } from '@ioc/token'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'
import { Language, languageSchema } from '@loader/schema/language'

export interface ILanguagesLoader {
    load(): Promise<void>
}

const logName = 'LanguagesLoader'
export const languagesLoaderToken = token<ILanguagesLoader>(logName)
export const languagesLoaderDependencies: Token<unknown>[] = [
    dataUrlToken,
    loggerToken,
    gameModelToken,
    languagesModelToken
]
export class LanguagesLoader implements ILanguagesLoader {
    constructor(
        private dataUrl: string,
        private logger: ILogger,
        private gameModel: IGameModelSet,
        private languagesModel: ILanguagesModelSet
    ){}

    public async load(): Promise<void> {
        const game = this.gameModel.game
        const languages = Object.keys(game.languages).sort()
        this.languagesModel.setLanguages(languages)
        const promises: Promise<void>[] = []
        languages.forEach(language => {
            const files = game.languages[language]
            files.forEach(file => {
                const path = `${this.dataUrl}/${file}`
                const loader = async (): Promise<void> => {
                    const translations = await loadJsonResource<Language>(path, languageSchema, this.logger)
                    this.languagesModel.setTranslations(language, translations.translations, file)
                }
                promises.push(loader())
            })
        })
        await Promise.all(promises)
    }
}
