import { Token, token } from '@ioc/token'
import { type DialogSet as DialogSetData } from './data/dialog'
import { dataPathProviderToken, IDataPathProvider } from '@providers/configProviders'
import { DialogSet, dialogSetSchema } from './schema/dialog'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'
import { mapDialogSet } from './mappers/dialog'

export interface IDialogSetLoader {
    loadDialogSet(path: string): Promise<DialogSetData>
}

const logName = 'DialogSetLoader'
export const dialogSetLoaderToken = token<IDialogSetLoader>(logName)
export const dialogSetLoaderDependencies: Token<unknown>[] = [dataPathProviderToken, loggerToken]
export class DialogSetLoader implements IDialogSetLoader {
    constructor(
        private dataPathProvider: IDataPathProvider,
        private logger: ILogger
    ){}

    public async loadDialogSet(path: string): Promise<DialogSetData> {
        const schema = await loadJsonResource<DialogSet>(`${this.dataPathProvider.dataPath}/${path}`, dialogSetSchema, this.logger)
        return mapDialogSet(schema)
    }
}
