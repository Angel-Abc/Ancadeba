import { Token, token } from '@ioc/token'
import { VirtualKeys as VirtualKeysData } from './data/inputs'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { fatalError } from '@utils/logMessage'
import { VirtualKeys, virtualKeysSchema } from './schema/inputs'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapVirtualKeys } from './mappers/input'

/**
 * Defines the contract for loading and mapping virtual key definitions.
 */
export interface IVirtualKeysLoader {
    /**
     * Loads and maps virtual key schemas from the specified JSON files.
     *
     * @param paths Relative paths to virtual key JSON files. Must contain at
     * least one path.
     * @returns Combined array of virtual key definitions.
     * @throws If no paths are provided or any file fails to load or validate.
     */
    loadVirtualKeys(paths: string[]): Promise<VirtualKeysData>
}

const logName = 'VirtualKeysLoader'
export const virtualKeysLoaderToken = token<IVirtualKeysLoader>(logName)
export const virtualKeysLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]

/**
 * Loads virtual key definitions using a base path provider.
 */
export class VirtualKeysLoader implements IVirtualKeysLoader {
    /**
     * @param dataPathProvider Provides the base directory for virtual key data
     * files.
     */
    constructor(
        private dataPathProvider: IDataPathProvider
    ) { }

    /**
     * Fetches, validates, and maps virtual key schemas from the given paths.
     *
     * @param paths Relative paths to virtual key JSON files.
     * @returns Flattened list of mapped virtual key definitions.
     * @throws If no paths are provided or any key file fails to load or
     * validate.
     */
    public async loadVirtualKeys(paths: string[]): Promise<VirtualKeysData> {
        if (paths.length === 0) {
            fatalError(logName, 'No virtual keys paths provided')
        }

        const schemas = await Promise.all(
            paths.map(path => loadJsonResource<VirtualKeys>(`${this.dataPathProvider.dataPath}/${path}`, virtualKeysSchema))
        )

        const result = schemas.reduce<VirtualKeysData>((acc, schema) => [...acc, ...mapVirtualKeys(schema)], [])
        return result
    }
}
