import { Token, token } from '@ioc/token'
import { GotoDialogAction } from '@loader/data/dialog'
import { SET_DIALOG, WRITE_OUTPUT } from '@messages/system'
import { IActionHandler } from '@registries/actionHandlerRegistry'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { Message } from '@utils/types'

export type IGoToDialog = IActionHandler<GotoDialogAction>

const logName = 'GoToDialog'
export const goToDialogToken = token<IGoToDialog>(logName)
export const goToDialogDependencies: Token<unknown>[] = [messageBusToken, translationServiceToken]
export class GoToDialog implements IGoToDialog {
    readonly type = 'goto' as const
    constructor(
        private messageBus: IMessageBus,
        private translationService: ITranslationService
    ){}

    public handle(action: GotoDialogAction, _message?: Message, data?: unknown): void {
        void _message
        if (data) {
            this.messageBus.postMessage({
                message: WRITE_OUTPUT,
                payload: `<p>&gt; ${this.translationService.translate(data as string)}</p>`
            })
        }
        this.messageBus.postMessage({
            message: SET_DIALOG,
            payload: action.target
        })
    }
}
