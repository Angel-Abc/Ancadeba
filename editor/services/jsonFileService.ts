import { Token, token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'

export interface IJsonFileService {
    load<T>(path: string): Promise<T>
    save<T>(path: string, data: T): Promise<void>
}

const logName = 'JsonFileService'
export const jsonFileServiceToken = token<IJsonFileService>(logName)
export const jsonFileServiceDependencies: Token<unknown>[] = [loggerToken]
export class JsonFileSerive implements IJsonFileService {
    constructor(
        private logger: ILogger
    ){}

    public async load<T>(path: string): Promise<T> {
        const response = await fetch(`/data/${path}`)
        if (!response.ok) {
            throw new Error(this.logger.error(logName, 'Failed to load {0}', path))
        }
        return await response.json() as T
    }

    public async save<T>(path: string, data: T): Promise<void> {
        const response = await fetch(`/data/${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) {
            throw new Error(this.logger.error('Failed to save {0}', path))
        }
    }
}
