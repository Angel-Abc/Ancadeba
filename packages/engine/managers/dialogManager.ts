import { Token, token } from '@ioc/token'
import { DIALOG_SET_SET, DIALOG_SET_UPDATED } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface IDialogManager {
    initialize(): void
    cleanup(): void
}

const logName = 'DialogManager'
export const dialogManagerToken = token<IDialogManager>(logName)
export const dialogManagerDependencies: Token<unknown>[] = [gameDataProviderToken, messageBusToken, loggerToken]
export class DialogManager implements IDialogManager {
    private cleanupFn: CleanUp | null = null
    constructor(
        private gameDataProvider: IGameDataProvider,
        private messageBus: IMessageBus,
        private logger: ILogger
    ){}

    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    public initialize(): void {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            DIALOG_SET_SET,
            message => this.setDialog(message.payload as string)
        )
    }

    private setDialog(dialogId: string): void {
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
        this.gameDataProvider.Context.currentDialogSet.dialogId = dialogId
        this.gameDataProvider.Context.isInModalDialog = !dialog.behavior.canMove
        
        this.messageBus.postMessage({
            message: DIALOG_SET_UPDATED,
            payload: dialogId
        })
    }
}

