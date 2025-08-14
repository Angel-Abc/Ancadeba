/**
 * Retrieves page definitions from disk, validates them against the
 * {@link pageSchema} and maps them into an internal representation.
 */
import { Token, token } from '@ioc/token'
import { type Page as PageData } from '@loader/data/page'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import { Page, pageSchema } from './schema/page'
import { mapPage } from './mappers/page'

/**
 * Describes functionality for loading individual pages.
 */
export interface IPageLoader {
    /**
     * Fetches and validates a page definition at the given path.
     *
     * @param path Relative path to the page JSON.
     * @returns A promise resolving to mapped page data.
     */
    loadPage(path: string): Promise<PageData>
}

export const pageLoaderToken = token<IPageLoader>('PageLoader')
export const pageLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]

/**
 * Loads page data using a base path provided by {@link IDataPathProvider}.
 */
export class PageLoader implements IPageLoader {
    /**
     * @param basePathProvider Provides the base directory for page data files.
     */
    constructor(private basePathProvider: IDataPathProvider) {}

    /**
     * Reads a page file, validates it and maps it into runtime data.
     *
     * @param path Relative path to the page JSON.
     * @returns The fully mapped {@link PageData} object.
     */
    public async loadPage(path: string): Promise<PageData> {
        const schema = await loadJsonResource<Page>(`${this.basePathProvider.dataPath}/${path}`, pageSchema)
        return mapPage(this.basePathProvider.dataPath, schema)
    }
}
