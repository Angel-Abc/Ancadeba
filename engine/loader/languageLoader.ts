/**
 * Loads multiple language files, validates them against the
 * {@link languageSchema} and merges their translations into a single object.
 */
import { Token, token } from '@ioc/token'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { type Language as LanguageData } from './data/language'
import { Language, languageSchema } from './schema/language'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapLanguage } from './mappers/language'
import { fatalError } from '@utils/logMessage'

/**
 * Defines the contract for loading and merging language files.
 */
export interface ILanguageLoader {
    /**
     * Fetches and validates language files and merges their translations.
     *
     * @param paths Relative paths to language JSON files.
     * @returns Promise resolving to merged language data.
     */
    loadLanguage(paths: string[]): Promise<LanguageData>
}

const logName = 'LanguageLoader'
export const languageLoaderToken = token<ILanguageLoader>(logName)
export const languageLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]

/**
 * Loads language data using a base path provided by {@link IDataPathProvider}.
 */
export class LanguageLoader implements ILanguageLoader {
    /**
     * @param basePathProvider Provides the base directory for language data files.
     */
    constructor(private basePathProvider: IDataPathProvider) {
    }

    /**
     * Reads multiple language files, validates them and merges their contents.
     *
     * @param paths Relative paths to language JSON files.
     * @returns The combined {@link LanguageData} object containing all translations.
     * @throws If no paths are provided or their IDs do not match.
     */
    public async loadLanguage(paths: string[]): Promise<LanguageData> {
        if (paths.length === 0) {
            fatalError(logName, 'No language paths provided')
        }

        const schemas = await Promise.all(
            paths.map(path => loadJsonResource<Language>(`${this.basePathProvider.dataPath}/${path}`, languageSchema))
        )
        const languages = schemas.map(mapLanguage)

        const sharedId = languages[0].id
        const mismatched = languages.find(lang => lang.id !== sharedId)
        if (mismatched) {
            fatalError(logName, 'Language ID mismatch: expected {0} but got {1}', sharedId, mismatched.id)
        }

        return {
            id: sharedId,
            translations: languages.reduce((acc, lang) => {
                return { ...acc, ...lang.translations }
            }, {})
        }
    }
}
