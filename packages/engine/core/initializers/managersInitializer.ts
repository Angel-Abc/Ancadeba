import { Token, token } from '@ioc/token'
import { IInitializer } from './engineInitializer'
import { actionManagerToken, IActionManager } from '@managers/actionManager'
import { dialogManagerToken, IDialogManager } from '@managers/dialogManager'
import { dialogOutputManagerToken, IDialogOutputManager } from '@managers/dialogOutputManager'
import { dialogSetManagerToken, IDialogSetManager } from '@managers/dialogSetManager'
import { IInputManager, inputManagerToken } from '@managers/inputManager'
import { IMapManager, mapManagerToken } from '@managers/mapManager'
import { IPageManager, pageManagerToken } from '@managers/pageManager'
import { IPlayerPositionManager, playerPositionManagerToken } from '@managers/playerPositionManager'
import { ITileTriggerManager, tileTriggerManagerToken } from '@managers/tileTriggerManager'
import { ITurnManager, turnManagerToken } from '@managers/turnManager'
import { ITurnOutputManager, turnOutputManagerToken } from '@managers/turnOutputManager'

export type IManagersInitializer = IInitializer

const logName = 'ManagersInitializer'
export const managersInitializerToken = token<IManagersInitializer>(logName)
export const managersInitializerDependencies: Token<unknown>[] = [
    actionManagerToken,
    dialogManagerToken,
    dialogOutputManagerToken,
    dialogSetManagerToken,
    inputManagerToken,
    mapManagerToken,
    pageManagerToken,
    playerPositionManagerToken,
    tileTriggerManagerToken,
    turnManagerToken,
    turnOutputManagerToken
]
export class ManagersInitializer implements IManagersInitializer {
    constructor(
        private actionManager: IActionManager,
        private dialogManager: IDialogManager,
        private dialogOutputManager: IDialogOutputManager,
        private dialogSetManager: IDialogSetManager,
        private inputManager: IInputManager,
        private mapManager: IMapManager,
        private pageManager: IPageManager,
        private playerPositionManager: IPlayerPositionManager,
        private tileTriggerManager: ITileTriggerManager,
        private turnManager: ITurnManager,
        private turnOutputManager: ITurnOutputManager
    ){}

    public async initialize(): Promise<void> {
        await this.actionManager.initialize()
        await this.dialogManager.initialize()
        await this.dialogOutputManager.initialize()
        await this.dialogSetManager.initialize()
        await this.inputManager.initialize()
        await this.mapManager.initialize()
        await this.pageManager.initialize()
        await this.playerPositionManager.initialize()
        await this.tileTriggerManager.initialize()
        await this.turnManager.initialize()
        await this.turnOutputManager.initialize()
    }
}
