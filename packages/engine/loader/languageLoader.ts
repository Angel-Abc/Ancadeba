/**
 * Loads multiple language files, validates them against the
 * {@link languageSchema} and merges their translations into a single object.
 */
import { Token, token } from '@ioc/token'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { type Language as LanguageData } from './data/language'
import { Language, languageSchema } from './schema/language'
import { loadJsonResource } from '@utils/loadJsonResource'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { mapLanguage } from './mappers/language'

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
export const languageLoaderDependencies: Token<unknown>[] = [dataPathProviderToken, loggerToken]

/**
 * Loads language data using a base path provided by {@link IDataPathProvider}.
 */
export class LanguageLoader implements ILanguageLoader {
    /**
     * @param dataPathProvider Provides the base directory for language data files.
     */
    constructor(private dataPathProvider: IDataPathProvider, private logger: ILogger) {
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
            this.logger.error(logName, 'No language paths provided')
            throw new Error('No language paths provided')
        }

        const schemas = await Promise.all(
            paths.map(path => loadJsonResource<Language>(`${this.dataPathProvider.dataPath}/${path}`, languageSchema, this.logger))
        )
        const languages = schemas.map(mapLanguage)

        const sharedId = languages[0].id
        const mismatched = languages.find(lang => lang.id !== sharedId)
        if (mismatched) {
            this.logger.error(
                logName,
                'Language ID mismatch: expected {0} but got {1}',
                sharedId,
                mismatched.id
            )
            throw new Error(
                `Language ID mismatch: expected ${sharedId} but got ${mismatched.id}`
            )
        }

        return {
            id: sharedId,
            translations: languages.reduce((acc, lang) => {
                return { ...acc, ...lang.translations }
            }, {})
        }
    }
}
