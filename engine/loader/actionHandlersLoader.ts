import { Token, token } from '@ioc/token'
import { type Handlers as HandlersData } from './data/handler'
import { Handlers, handlersSchema } from './schema/handler'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import { fatalError } from '@utils/logMessage'
import { mapHandlers } from './mappers/handler'

export interface IActionHandlersLoader {
    loadActions(paths: string[]): Promise<HandlersData>
}

const logName = 'ActionHandlersLoader'
export const actionHandlersLoaderToken = token<IActionHandlersLoader>(logName)
export const actionHandlersLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class ActionHandlersLoader implements IActionHandlersLoader {
    constructor(private basePathProvider: IDataPathProvider) {
    }

    public async loadActions(paths: string[]): Promise<HandlersData> {
        if (paths.length === 0) {
            fatalError(logName, 'No action handlers paths provided')
        }

        const schemas = await Promise.all(
            paths.map(path => loadJsonResource<Handlers>(`${this.basePathProvider.dataPath}/${path}`, handlersSchema))
        )

        const handlers = schemas.reduce<HandlersData>((acc, schema) => [...acc, ...mapHandlers(schema)], [])
        return handlers
    }
}
