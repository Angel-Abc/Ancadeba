import { Token, token } from '@ioc/token'
import { VirtualKeys as VirtualKeysData } from './data/inputs'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { fatalError } from '@utils/logMessage'
import { VirtualKeys, virtualKeysSchema } from './schema/inputs'
import { loadJsonResource } from '@utils/loadJsonResource'
import { mapVirtualKeys } from './mappers/input'

export interface IVirtualKeysLoader {
    loadVirtualKeys(paths: string[]): Promise<VirtualKeysData>
}

const logName = 'VirtualKeysLoader'
export const virtualKeysLoaderToken = token<IVirtualKeysLoader>(logName)
export const virtualKeysLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class VirtualKeysLoader implements IVirtualKeysLoader {
    constructor(
        private dataPathProvider: IDataPathProvider
    ) { }

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
