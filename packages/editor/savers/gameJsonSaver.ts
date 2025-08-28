import { dataUrlToken } from '@editor/managers/gameDataLoaderManager'
import { Token, token } from '@ioc/token'
import { saveJsonResource } from '@utils/saveJsonResource'
import { ILogger, loggerToken } from '@utils/logger'
import { ZodType } from 'zod'

export interface IGameJsonSaver {
    saveJson<T>(path: string, data: T, schema: ZodType<T>): Promise<void>
}

const logName = 'GameJsonSaver'
export const gameJsonSaverToken = token<IGameJsonSaver>(logName)
export const gameJsonSaverDependencies: Token<unknown>[] = [
    loggerToken,
    dataUrlToken
]
export class GameJsonSaver implements IGameJsonSaver {
    constructor(
        private logger: ILogger,
        private dataUrl: string
    ) {}

    public async saveJson<T>(path: string, data: T, schema: ZodType<T>): Promise<void> {
        await saveJsonResource(`${this.dataUrl}/${path}`, data, schema, this.logger)
    }
}

