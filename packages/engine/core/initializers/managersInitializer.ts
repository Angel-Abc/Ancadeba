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

/**
 * Aggregated initializer for all engine manager components.
 */
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
/**
 * Sequentially initializes all manager instances that coordinate game logic.
 */
export class ManagersInitializer implements IManagersInitializer {
    /**
     * @param actionManager Handles player actions.
     * @param dialogManager Manages dialog state and flow.
     * @param dialogOutputManager Renders dialog output.
     * @param dialogSetManager Provides dialog definitions.
     * @param inputManager Captures and processes player input.
     * @param mapManager Maintains the game map state.
     * @param pageManager Controls high level page navigation.
     * @param playerPositionManager Tracks player location.
     * @param tileTriggerManager Evaluates tile based triggers.
     * @param turnManager Coordinates turn based progression.
     * @param turnOutputManager Displays the results of each turn.
     */
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

    /**
     * Initializes each manager in the order required for correct dependencies.
     */
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
