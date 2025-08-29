import { Token, token } from '@ioc/token'
import { Input } from '@loader/data/inputs'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IInputsProvider } from '@registries/inputsProviderRegistry'

export type IDialogInputs = IInputsProvider

const logName = 'DialogInputs'
export const dialogInputsToken = token<IDialogInputs>(logName)
export const dialogInputsDependencies: Token<unknown>[] = [gameDataProviderToken]
export class DialogInputs implements IDialogInputs {
    constructor(
        private gameDataProvider: IGameDataProvider
    ) { }

    public isActive(): boolean {
        const dialogSetId = this.gameDataProvider.context.currentDialogSet.dialogSetId
        if (!dialogSetId) return false
        const dialogId = this.gameDataProvider.context.currentDialogSet.dialogId
        if (!dialogId) return false
        return true
    }

    public getInputs(): Input[] {
        const dialogSetId = this.gameDataProvider.context.currentDialogSet.dialogSetId
        const dialogId = this.gameDataProvider.context.currentDialogSet.dialogId
        if (dialogId && dialogSetId) {
            const dialogSet = this.gameDataProvider.game.loadedDialogSets.get(dialogSetId)
            if (dialogSet){
                const dialog = dialogSet.dialogs[dialogId]
                if (dialog) {
                    return dialog.choices.map<Input>((choice, index) => {
                        return {
                            virtualInput: `VI_${index + 1}`,
                            preferredRow: 0,
                            preferredCol: index,
                            label: choice.label,
                            description: choice.label,
                            visible: choice.visible,
                            enabled: choice.enabled,
                            action: choice.action
                        }
                    })
                }
            }
        }

        return []
    }
}
