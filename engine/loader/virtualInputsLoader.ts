import { Token, token } from '@ioc/token'
import { type VirtualInputs as VirtualInputsData } from './data/inputs'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { fatalError } from '@utils/logMessage'
import { loadJsonResource } from '@utils/loadJsonResource'
import { VirtualInputs, virtualInputsSchema } from './schema/inputs'
import { mapVirtualInputs } from './mappers/input'

export interface IVirtualInputsLoader {
    loadVirtualInputs(paths: string[]): Promise<VirtualInputsData>
}

const logName = 'VirtualInputsLoader'
export const virtualInputsLoaderToken = token<IVirtualInputsLoader>(logName)
export const virtualInputsLoaderDependencies: Token<unknown>[] = [dataPathProviderToken]
export class VirtualInputsLoader implements IVirtualInputsLoader {
    constructor(
        private dataPathProvider: IDataPathProvider
    ){}

    public async loadVirtualInputs(paths: string[]): Promise<VirtualInputsData> {
        if (paths.length === 0) {
            fatalError(logName, 'No virtual inputs paths provided')
        }
        
        const schemas = await Promise.all(
            paths.map(path => loadJsonResource<VirtualInputs>(`${this.dataPathProvider.dataPath}/${path}`, virtualInputsSchema))
        )

        const result = schemas.reduce<VirtualInputsData>((acc, schema) => [...acc, ...mapVirtualInputs(schema)], [])
        return result
    }
}
