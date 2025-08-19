import { Token, token } from '@ioc/token'
import { ISubsystemInitializer } from '@core/subsystemInitializer'
import { pageManagerToken, IPageManager } from '@managers/pageManager'
import { actionManagerToken, IActionManager } from '@managers/actionManager'
import { mapManagerToken, IMapManager } from '@managers/mapManager'
import { virtualKeyProviderToken, IVirtualKeyProvider } from '@providers/virtualKeyProvider'
import { virtualInputProviderToken, IVirtualInputProvider } from '@providers/virtualInputProvider'
import { turnManagerToken, ITurnManager } from '@managers/turnManager'
import { inputManagerToken, IInputManager } from '@managers/inputManager'
import { playerPositionManagerToken, IPlayerPositionManager } from '@managers/playerPositionManager'
import { tileTriggerManagerToken, ITileTriggerManager } from '@managers/tileTriggerManager'
import { turnOutputManagerToken, ITurnOutputManager } from '@managers/turnOutputManager'

export const pageManagersInitializerToken = token<ISubsystemInitializer>('page-managers-initializer')
export const pageManagersInitializerDependencies: Token<unknown>[] = [
    pageManagerToken,
    actionManagerToken,
    mapManagerToken,
    virtualKeyProviderToken,
    virtualInputProviderToken,
    turnManagerToken,
    inputManagerToken,
    playerPositionManagerToken,
    tileTriggerManagerToken,
    turnOutputManagerToken,
]

export class PageManagersInitializer implements ISubsystemInitializer {
    constructor(
        private pageManager: IPageManager,
        private actionManager: IActionManager,
        private mapManager: IMapManager,
        private virtualKeyProvider: IVirtualKeyProvider,
        private virtualInputProvider: IVirtualInputProvider,
        private turnManager: ITurnManager,
        private inputManager: IInputManager,
        private playerPositionManager: IPlayerPositionManager,
        private tileTriggerManager: ITileTriggerManager,
        private turnOutputManager: ITurnOutputManager,
    ) {}

    async initialize(): Promise<void> {
        this.pageManager.initialize()
        await this.actionManager.initialize()
        this.mapManager.initialize()
        await this.virtualKeyProvider.initialize()
        await this.virtualInputProvider.initialize()
        this.turnManager.initialize()
        this.inputManager.initialize()
        this.playerPositionManager.initialize()
        this.tileTriggerManager.initialize()
        this.turnOutputManager.initialize()
    }
}
