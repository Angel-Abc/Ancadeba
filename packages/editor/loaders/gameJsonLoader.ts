import { dataUrlToken } from '@editor/managers/gameDefinitionLoaderManager'
import { Token, token } from '@ioc/token'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'
import { ZodType } from 'zod'

export interface IGameJsonLoader {
    loadJson<T>(path: string, schema: ZodType<T>): Promise<T>
}

const logName = 'GameJsonLoader'
export const gameJsonLoaderToken = token<IGameJsonLoader>(logName)
export const gameJsonLoaderDependencies: Token<unknown>[] = [
    loggerToken,
    dataUrlToken
]
export class GameJsonLoader implements IGameJsonLoader {
    constructor(
        private logger: ILogger,
        private dataUrl: string
    ){}

    public async loadJson<T>(path: string, schema: ZodType<T>): Promise<T> {
        const result = await loadJsonResource<T>(`${this.dataUrl}/${path}`, schema, this.logger)
        return result
    }
}
