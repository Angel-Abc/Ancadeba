import { Container } from '@ioc/container'
import { ActionManager, actionManagerDependencies, actionManagerToken } from '@managers/actionManager'
import { DialogManager, dialogManagerDependencies, dialogManagerToken } from '@managers/dialogManager'
import { DialogOutputManager, dialogOutputManagerDependencies, dialogOutputManagerToken } from '@managers/dialogOutputManager'
import { DialogSetManager, dialogSetManagerDependencies, dialogSetManagerToken } from '@managers/dialogSetManager'
import { DomManager, domManagerDependencies, domManagerToken } from '@managers/domManager'
import { InputManager, inputManagerDependencies, inputManagerToken } from '@managers/inputManager'
import { LanguageManager, languageManagerDependencies, languageManagerToken } from '@managers/languageManager'
import { MapManager, mapManagerDependencies, mapManagerToken } from '@managers/mapManager'
import { PageManager, pageManagerDependencies, pageManagerToken } from '@managers/pageManager'
import { PlayerPositionManager, playerPositionManagerDependencies, playerPositionManagerToken } from '@managers/playerPositionManager'
import { TileSetManager, tileSetManagerDependencies, tileSetManagerToken } from '@managers/tileSetManager'
import { TileTriggerManager, tileTriggerManagerDependencies, tileTriggerManagerToken } from '@managers/tileTriggerManager'
import { TurnManager, turnManagerDependencies, turnManagerToken } from '@managers/turnManager'
import { TurnOutputManager, turnOutputManagerDependencies, turnOutputManagerToken } from '@managers/turnOutputManager'

export class ManagersBuilder {
    public register(container: Container): void {
        container.register({
            token: languageManagerToken,
            useClass: LanguageManager,
            deps: languageManagerDependencies
        })
        container.register({
            token: actionManagerToken,
            useClass: ActionManager,
            deps: actionManagerDependencies
        })
        container.register({
            token: dialogManagerToken,
            useClass: DialogManager,
            deps: dialogManagerDependencies
        })
        container.register({
            token: dialogOutputManagerToken,
            useClass: DialogOutputManager,
            deps: dialogOutputManagerDependencies
        })
        container.register({
            token: dialogSetManagerToken,
            useClass: DialogSetManager,
            deps: dialogSetManagerDependencies
        })
        container.register({
            token: domManagerToken,
            useClass: DomManager,
            deps: domManagerDependencies
        })
        container.register({
            token: inputManagerToken,
            useClass: InputManager,
            deps: inputManagerDependencies
        })
        container.register({
            token: mapManagerToken,
            useClass: MapManager,
            deps: mapManagerDependencies
        })
        container.register({
            token: pageManagerToken,
            useClass: PageManager,
            deps: pageManagerDependencies
        })
        container.register({
            token: playerPositionManagerToken,
            useClass: PlayerPositionManager,
            deps: playerPositionManagerDependencies
        })
        container.register({
            token: tileSetManagerToken,
            useClass: TileSetManager,
            deps: tileSetManagerDependencies
        })
        container.register({
            token: tileTriggerManagerToken,
            useClass: TileTriggerManager,
            deps: tileTriggerManagerDependencies
        })
        container.register({
            token: turnManagerToken,
            useClass: TurnManager,
            deps: turnManagerDependencies
        })
        container.register({
            token: turnOutputManagerToken,
            useClass: TurnOutputManager,
            deps: turnOutputManagerDependencies
        })
    }
}
