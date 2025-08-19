import { Container } from '@ioc/container'
import { token } from '@ioc/token'
import { ILogger, loggerToken } from '@utils/logger'

export interface IJsonFileService {
    load<T>(path: string): Promise<T>
    save<T>(path: string, data: T): Promise<void>
}

export const jsonFileServiceToken = token<IJsonFileService>('json-file-service')

export class FileJsonFileService implements IJsonFileService {
    public async load<T>(path: string): Promise<T> {
        const response = await fetch(`/data/${path}`)
        if (!response.ok) {
            throw new Error(`Failed to load ${path}`)
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
            throw new Error(`Failed to save ${path}`)
        }
    }
}

export interface IContainerBuilder {
    build(): Container
}

export class ContainerBuilder implements IContainerBuilder {
    constructor(
        private loggerFactory: () => ILogger
    ) { }

    public build(): Container {
        const logger = this.loggerFactory()
        const result = new Container(logger)
        result.register({ token: loggerToken, useValue: logger })
        result.register<IJsonFileService>({ token: jsonFileServiceToken, useClass: FileJsonFileService })
        return result
    }
}
