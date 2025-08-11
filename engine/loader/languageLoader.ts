import { token } from '@ioc/token'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { type Language as LanguageData } from './data/language'
import { Language, languageSchema } from './schema/language'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapLanguage } from './mappers/language'

export interface ILanguageLoader {
    loadLanguage: (language: string) => Promise<LanguageData>
}

export const languageLoaderToken = token<ILanguageLoader>('LanguageLoader')
export const languageLoaderDependencies = [dataPathProviderToken]
export class LanguageLoader implements ILanguageLoader {
    constructor(private basePathProvider: IDataPathProvider) {
    }
    public async loadLanguage(language: string): Promise<LanguageData> {
        const schema = await loadJsonResource<Language>(`${this.basePathProvider.dataPath}/languages/${language}.json`, languageSchema)
        return mapLanguage(schema)
    }
}
