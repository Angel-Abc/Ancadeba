import { Token, token } from '@ioc/token'
import { ISubsystemInitializer } from '@core/subsystemInitializer'
import { dialogSetManagerToken, IDialogSetManager } from '@managers/dialogSetManager'
import { dialogManagerToken, IDialogManager } from '@managers/dialogManager'
import { dialogOutputManagerToken, IDialogOutputManager } from '@managers/dialogOutputManager'

export const dialogManagersInitializerToken = token<ISubsystemInitializer>('dialog-managers-initializer')
export const dialogManagersInitializerDependencies: Token<unknown>[] = [
    dialogSetManagerToken,
    dialogManagerToken,
    dialogOutputManagerToken,
]

export class DialogManagersInitializer implements ISubsystemInitializer {
    constructor(
        private dialogSetManager: IDialogSetManager,
        private dialogManager: IDialogManager,
        private dialogOutputManager: IDialogOutputManager,
    ) {}

    async initialize(): Promise<void> {
        this.dialogSetManager.initialize()
        this.dialogManager.initialize()
        this.dialogOutputManager.initialize()
    }
}
