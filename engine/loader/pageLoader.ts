import { Token, token } from '@ioc/token'
import { type Page as PageData } from '@loader/data/page'
import { dataPathProviderToken, IDataPathProvider } from '../providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import { Page, pageSchema } from './schema/page'
import { mapPage } from './mappers/page'

export interface IPageLoader {
    loadPage: (path: string) => Promise<PageData>
}

export const pageLoaderToken = token<IPageLoader>('PageLoader')
export const pageLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class PageLoader implements IPageLoader {
    constructor(private basePathProvider: IDataPathProvider) {}

    public async loadPage(path: string): Promise<PageData> {
        const schema = await loadJsonResource<Page>(`${this.basePathProvider.dataPath}/${path}`, pageSchema)
        return mapPage(this.basePathProvider.dataPath, schema)
    }
}
