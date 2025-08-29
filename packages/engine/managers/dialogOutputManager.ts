import { Token, token } from '@ioc/token'
import { DIALOG_SET_UPDATED, WRITE_OUTPUT } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface IDialogOutputManager {
    initialize(): void
    cleanup(): void
}

const logName = 'DialogOutputManager'
export const dialogOutputManagerToken = token<IDialogOutputManager>(logName)
export const dialogOutputManagerDependencies: Token<unknown>[] = [gameDataProviderToken, messageBusToken,loggerToken, translationServiceToken]
export class DialogOutputManager implements IDialogOutputManager {
    private cleanupFn: CleanUp | null = null
    constructor(
        private gameDataProvider: IGameDataProvider,
        private messageBus: IMessageBus,
        private logger: ILogger,
        private translationService: ITranslationService
    ){}

    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    public initialize(): void {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            DIALOG_SET_UPDATED,
            message => this.onDialogSet(message.payload as string)
        )
    }

    private onDialogSet(dialogId: string): void {
        const dialogSetId = this.gameDataProvider.Context.currentDialogSet.dialogSetId
        if (!dialogSetId) return
        const dialogSet = this.gameDataProvider.Game.loadedDialogSets.get(dialogSetId)
        if (!dialogSet) {
            throw new Error(this.logger.error(logName, 'Dialog set not found for id {0}', dialogSetId))
        }
        const dialog = dialogSet.dialogs[dialogId]
        if (!dialog) {
            throw new Error(this.logger.error(logName, 'Dialog not found for id {0}', dialogId))
        }

        this.messageBus.postMessage({
            message: WRITE_OUTPUT,
            payload: this.translationService.translate(dialog.message)
        })
    }
}
