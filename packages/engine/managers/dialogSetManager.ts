import { conditionResolverToken, IConditionResolver } from '@conditions/conditionResolver'
import { Token, token } from '@ioc/token'
import { DialogSet } from '@loader/data/dialog'
import { dialogSetLoaderToken, IDialogSetLoader } from '@loader/dialogSetLoader'
import { DIALOG_SET_SET, DIALOG_SET_START, DIALOG_SET_STARTED } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { ILogger, loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface IDialogSetManager {
    initialize(): void
    cleanup(): void
}

const logName = 'DialogSetManager'
export const dialogSetManagerToken = token<IDialogSetManager>(logName)
export const dialogSetManagerDependencies: Token<unknown>[] = [gameDataProviderToken, messageBusToken, loggerToken, dialogSetLoaderToken, conditionResolverToken]
export class DialogSetManager implements IDialogSetManager {
    private cleanupFn: CleanUp | null = null
    constructor(
        private gameDataProvider: IGameDataProvider,
        private messageBus: IMessageBus,
        private logger: ILogger,
        private dialogSetLoader: IDialogSetLoader,
        private conditionResolver: IConditionResolver
    ) { }

    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
    }

    public initialize(): void {
        this.cleanup()
        this.cleanupFn = this.messageBus.registerMessageListener(
            DIALOG_SET_START,
            async message => {
                await this.startDialogSet(message.payload as string)
            }
        )
    }

    private async startDialogSet(dialogSetId: string): Promise<void> {
        const path = this.gameDataProvider.Game.game.dialogs[dialogSetId]
        if (!path) {
            throw new Error(this.logger.error(logName, 'Dialog set not found for id {0}', dialogSetId))
        }

        let dialogSet: DialogSet
        if (!this.gameDataProvider.Game.loadedDialogSets.has(dialogSetId)) {
            dialogSet = await this.dialogSetLoader.loadDialogSet(path)
            this.gameDataProvider.Game.loadedDialogSets.set(dialogSetId, dialogSet)
        } else {
            dialogSet = this.gameDataProvider.Game.loadedDialogSets.get(dialogSetId)!
        }

        // Now always restart the dialog. In the future this might change depending on dialog settings
        if (this.conditionResolver.resolve(dialogSet.startCondition)){
            this.gameDataProvider.Context.currentDialogSet = {
                dialogSetId: dialogSetId,
                dialogId: null
            }

            this.messageBus.postMessage({
                message: DIALOG_SET_STARTED,
                payload: dialogSetId
            })

            this.messageBus.postMessage({
                message: DIALOG_SET_SET,
                payload: dialogSet.startWith
            })
        }
    }
}

