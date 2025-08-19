import { Token, token } from '@ioc/token'
import { type VirtualInputs as VirtualInputsData } from './data/inputs'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { loadJsonResource } from '@utils/loadJsonResource'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { VirtualInputs, virtualInputsSchema } from './schema/inputs'
import { mapVirtualInputs } from './mappers/input'

/**
 * Defines the contract for loading and mapping virtual input definitions.
 */
export interface IVirtualInputsLoader {
    /**
     * Loads and maps virtual input schemas from the specified JSON files.
     *
     * @param paths Relative paths to virtual input JSON files. Must contain at
     * least one path.
     * @returns Combined array of virtual input definitions.
     * @throws If no paths are provided or any file fails to load or validate.
     */
    loadVirtualInputs(paths: string[]): Promise<VirtualInputsData>
}

const logName = 'VirtualInputsLoader'
export const virtualInputsLoaderToken = token<IVirtualInputsLoader>(logName)
export const virtualInputsLoaderDependencies: Token<unknown>[] = [dataPathProviderToken, loggerToken]

/**
 * Loads virtual input definitions using a base path provider.
 */
export class VirtualInputsLoader implements IVirtualInputsLoader {
    /**
     * @param dataPathProvider Provides the base directory for virtual input data
     * files.
     */
    constructor(
        private dataPathProvider: IDataPathProvider,
        private logger: ILogger
    ){}

    /**
     * Fetches, validates, and maps virtual input schemas from the given paths.
     *
     * @param paths Relative paths to virtual input JSON files.
     * @returns Flattened list of mapped virtual input definitions.
     * @throws If no paths are provided or any input file fails to load or
     * validate.
     */
    public async loadVirtualInputs(paths: string[]): Promise<VirtualInputsData> {
        if (paths.length === 0) {
            this.logger.error(logName, 'No virtual inputs paths provided')
            throw new Error('No virtual inputs paths provided')
        }

        const schemas = await Promise.all(
            paths.map(path => loadJsonResource<VirtualInputs>(`${this.dataPathProvider.dataPath}/${path}`, virtualInputsSchema, this.logger))
        )

        const result = schemas.reduce<VirtualInputsData>((acc, schema) => [...acc, ...mapVirtualInputs(schema)], [])
        return result
    }
}
