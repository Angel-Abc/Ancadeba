import { token } from '@ioc/token'

export interface IDataPathProvider {
    dataPath: string
}
export const dataPathProviderToken = token<IDataPathProvider>('DataPathProvider')

