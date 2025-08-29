import { Token, token } from '@ioc/token'
import { EndDialogAction } from '@loader/data/action'
import { WRITE_OUTPUT } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IActionHandler } from '@registries/actionHandlerRegistry'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { Message } from '@utils/types'

export type IEndDialog = IActionHandler<EndDialogAction>

const logName = 'EndDialog'
export const endDialogToken = token<IEndDialog>(logName)
export const endDialogDependencies: Token<unknown>[] = [messageBusToken, gameDataProviderToken, translationServiceToken]
export class EndDialog implements IEndDialog {
    readonly type = 'end-dialog' as const

    constructor(
        private messageBus: IMessageBus,
        private gameDataProvider: IGameDataProvider,
        private translationService: ITranslationService
    ){}

    public handle(action: EndDialogAction, message?: Message, data?: unknown): void {
        if (data) {
            this.messageBus.postMessage({
                message: WRITE_OUTPUT,
                payload: `<p>&gt; ${this.translationService.translate(data as string)}</p>`
            })
        }
        if (action.message) {
            this.messageBus.postMessage({
                message: WRITE_OUTPUT,
                payload: this.translationService.translate(action.message)
            })
        }
        this.gameDataProvider.context.currentDialogSet.dialogSetId = null
        this.gameDataProvider.context.currentDialogSet.dialogId = null
        this.gameDataProvider.context.isInModalDialog = false
    }
}
