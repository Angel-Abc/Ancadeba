import { INITIALIZED } from '@editor/messages/editor'
import { Token, token } from '@ioc/token'
import { Game, gameSchema } from '@loader/schema/game'
import { loadJsonResource } from '@utils/loadJsonResource'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface IStructureLoaderManager {
    initialize(): void
    cleanup(): void
}

const logName = 'StructureLoaderManager'
export const structureLoaderManagerToken = token<IStructureLoaderManager>(logName)
export const structureLoaderManagerDependencies: Token<unknown>[] = [loggerToken, messageBusToken]
export class StructureLoaderManager implements IStructureLoaderManager {
    private cleanupFn: CleanUp | null = null
    constructor(
        private logger: ILogger,
        private messageBus: IMessageBus
    ){}

    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    public initialize(): void {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            INITIALIZED,
            async () => await this.onInitialized()
        )       
    }

    private async onInitialized(): Promise<void> {
        const game = await loadJsonResource<Game>('http://localhost:3000/data/index.json', gameSchema, this.logger)
        this.logger.debug(logName, 'Loaded game data: {0}', game)
    }
}
