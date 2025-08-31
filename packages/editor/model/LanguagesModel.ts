import { Token, token } from '@ioc/token'
import { Translations } from '@loader/schema/language'
import { ILogger, loggerToken } from '@utils/logger'

export interface ITranslationModel {
    get key(): string
    get translation(): string[] | string
}

export interface ITranslationsModel {
    get file(): string
    get translations(): ITranslationModel[]
}


export interface ILanguageModel {
    get language(): string
    get translations(): ITranslationsModel[]
}

export interface ILanguagesModel {
    get languages(): ILanguageModel[]
}

export type ILanguagesModelSet = ILanguagesModel & {
    setLanguages(languages: string[]): void
    setTranslations(language: string, translations: Translations, file: string): void
}

const logName = 'LanguagesModel'
export const languagesModelToken = token<ILanguagesModel>(logName)
export const languagesModelDependencies: Token<unknown>[] = [
    loggerToken
]
export class LanguagesModel implements ILanguagesModelSet {
    private _languages: ILanguageModel[] | null = null

    constructor(
        private logger: ILogger
    ){}

    public setLanguages(languages: string[]): void {
        this._languages = languages.map(l => ({
            language: l,
            translations: []
        }))
    }

    public setTranslations(language: string, translations: Translations, file: string): void {
        const model = this.languages.find(l => l.language === language)!
        const translationsModel: ITranslationsModel = {
            file: file,
            translations: []
        }
        Object.keys(translations).forEach(key => {
            translationsModel.translations.push({
                key: key,
                translation: translations[key]
            })
        })
        model.translations.push(translationsModel)
    }

    public get languages(): ILanguageModel[] {
        if (this._languages !== null) return this._languages
        const error = this.logger.error(logName, 'No languages are set!')
        throw new Error(error)
    }
}
