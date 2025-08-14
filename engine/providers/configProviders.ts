import { token } from '@ioc/token'

/**
 * Provides the base path to application data used when loading
 * resources such as configuration files and assets.
 */
export interface IDataPathProvider {
    /** Base path to application data. */
    dataPath: string
}
export const dataPathProviderToken = token<IDataPathProvider>('DataPathProvider')

