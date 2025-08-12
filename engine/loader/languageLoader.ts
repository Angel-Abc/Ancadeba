import { Token, token } from '@ioc/token'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { type Language as LanguageData } from './data/language'
import { Language, languageSchema } from './schema/language'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapLanguage } from './mappers/language'

export interface ILanguageLoader {
    loadLanguage: (paths: string[]) => Promise<LanguageData>
}

export const languageLoaderToken = token<ILanguageLoader>('LanguageLoader')
export const languageLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class LanguageLoader implements ILanguageLoader {
    constructor(private basePathProvider: IDataPathProvider) {
    }
    
    public async loadLanguage(paths: string[]): Promise<LanguageData> {
        const schemas = await Promise.all(paths.map(path => loadJsonResource<Language>(`${this.basePathProvider.dataPath}/${path}`, languageSchema)))
        const languages = schemas.map(mapLanguage)
        return {
            id: languages[0].id,
            translations: languages.reduce((acc, lang) => {
                return { ...acc, ...lang.translations }
            }, {})
        }
    }
}
