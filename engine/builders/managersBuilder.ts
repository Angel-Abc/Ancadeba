import { Container } from '@ioc/container'
import { ActionManager, actionManagerDependencies, actionManagerToken } from '@managers/actionManager'
import { DomManager, domManagerDependencies, domManagerToken } from '@managers/domManager'
import { LanguageManager, languageManagerDependencies, languageManagerToken } from '@managers/languageManager'
import { MapManager, mapManagerDependencies, mapManagerToken } from '@managers/mapManager'
import { PageManager, pageManagerDependencies, pageManagerToken } from '@managers/pageManager'
import { TileSetManager, tileSetManagerDependencies, tileSetManagerToken } from '@managers/tileSetManager'
import { PlayerPositionManager, playerPositionManagerDependencies, playerPositionManagerToken } from '@managers/playerPositionManager'
import { TurnManager, turnManagerDependencies, turnManagerToken } from '@managers/turnManager'

/**
 * Registers manager classes that orchestrate major engine systems.
 */
export class ManagersBuilder {
  /**
   * Register manager dependencies into the container.
   */
  register(container: Container): void {
    container.register({
      token: domManagerToken,
      useClass: DomManager,
      deps: domManagerDependencies,
      scope: 'transient'
    })
    container.register({
      token: languageManagerToken,
      useClass: LanguageManager,
      deps: languageManagerDependencies
    })
    container.register({
      token: pageManagerToken,
      useClass: PageManager,
      deps: pageManagerDependencies
    })
    container.register({
      token: actionManagerToken,
      useClass: ActionManager,
      deps: actionManagerDependencies
    })
    container.register({
      token: tileSetManagerToken,
      useClass: TileSetManager,
      deps: tileSetManagerDependencies
    })
    container.register({
      token: playerPositionManagerToken,
      useClass: PlayerPositionManager,
      deps: playerPositionManagerDependencies
    })
    container.register({
      token: mapManagerToken,
      useClass: MapManager,
      deps: mapManagerDependencies
    })
    container.register({
      token: turnManagerToken,
      useClass: TurnManager,
      deps: turnManagerDependencies
    })
  }
}

