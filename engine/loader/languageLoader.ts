import { Token, token } from '@ioc/token'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { type Language as LanguageData } from './data/language'
import { Language, languageSchema } from './schema/language'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapLanguage } from './mappers/language'

export interface ILanguageLoader {
    loadLanguage(paths: string[]): Promise<LanguageData>
}

export const languageLoaderToken = token<ILanguageLoader>('LanguageLoader')
export const languageLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class LanguageLoader implements ILanguageLoader {
    constructor(private basePathProvider: IDataPathProvider) {
    }

    public async loadLanguage(paths: string[]): Promise<LanguageData> {
        if (paths.length === 0) {
            throw new Error('[LanguageLoader] No language paths provided')
        }

        const schemas = await Promise.all(
            paths.map(path => loadJsonResource<Language>(`${this.basePathProvider.dataPath}/${path}`, languageSchema))
        )
        const languages = schemas.map(mapLanguage)

        const sharedId = languages[0].id
        const mismatched = languages.find(lang => lang.id !== sharedId)
        if (mismatched) {
            throw new Error(`[LanguageLoader] Language ID mismatch: expected ${sharedId} but got ${mismatched.id}`)
        }

        return {
            id: sharedId,
            translations: languages.reduce((acc, lang) => {
                return { ...acc, ...lang.translations }
            }, {})
        }
    }
}
