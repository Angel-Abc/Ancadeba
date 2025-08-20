import { INITIALIZED } from '@editor/messages/editor'
import { Token, token } from '@ioc/token'
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

    }
}
