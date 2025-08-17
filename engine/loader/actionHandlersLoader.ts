import { Token, token } from '@ioc/token'
import { type Handlers as HandlersData } from './data/handler'
import { Handlers, handlersSchema } from './schema/handler'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { mapHandlers } from './mappers/handler'

/**
 * Defines the contract for loading and mapping action handlers.
 */
export interface IActionHandlersLoader {
    /**
     * Loads and maps action handlers from the specified JSON files.
     *
     * @param paths Relative paths to action handler JSON files. Must contain
     * at least one path.
     * @returns Combined array of action handler definitions.
     * @throws If no paths are provided or any file fails to load or validate.
     */
    loadActions(paths: string[]): Promise<HandlersData>
}

const logName = 'ActionHandlersLoader'
export const actionHandlersLoaderToken = token<IActionHandlersLoader>(logName)
export const actionHandlersLoaderDependencies: Token<unknown>[] = [dataPathProviderToken, loggerToken]

/**
 * Loads action handler definitions using a base path provider.
 */
export class ActionHandlersLoader implements IActionHandlersLoader {
    /**
     * @param dataPathProvider Provides the base directory for handler data files.
     */
    constructor(private dataPathProvider: IDataPathProvider, private logger: ILogger) {
    }

    /**
     * Fetches, validates, and maps action handler schemas from the given paths.
     *
     * @param paths Relative paths to action handler JSON files.
     * @returns Flattened list of mapped handler definitions.
     * @throws If no paths are provided or any handler file fails to load or
     * validate.
     */
    public async loadActions(paths: string[]): Promise<HandlersData> {
        if (paths.length === 0) {
            this.logger.error(logName, 'No action handlers paths provided')
            throw new Error('No action handlers paths provided')
        }

        const schemas = await Promise.all(
            paths.map(path =>
                loadJsonResource<Handlers>(
                    `${this.dataPathProvider.dataPath}/${path}`,
                    handlersSchema,
                    this.logger
                )
            )
        )

        const handlers: HandlersData = []
        for (const schema of schemas) {
            handlers.push(...mapHandlers(schema))
        }
        return handlers
    }
}
