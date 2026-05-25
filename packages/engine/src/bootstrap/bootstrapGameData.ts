import {
  ILogger,
  IMessageBus,
  loggerToken,
  messageBusToken,
  Token,
  typedKeys,
} from '@ancadeba/utils'
import { IBootstrapGameData } from './types'
import { Game } from '@ancadeba/content'
import {
  mapDefinitionProviderToken,
  surfaceDefinitionProviderToken,
  tileSetDefinitionProviderToken,
  widgetDefinitionProviderToken,
} from '../providers/definition/tokens'
import {
  IMapDefinitionProvider,
  ISurfaceDefinitionProvider,
  ITileSetDefinitionProvider,
  IWidgetDefinitionProvider,
} from '../providers/definition/types'
import { bootstrapGameDataToken } from './tokens'
import { MESSAGE_ENGINE_PROGRESS } from './messages'

export const bootstrapGameDataDependencies: Token<unknown>[] = [
  loggerToken,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
  mapDefinitionProviderToken,
  tileSetDefinitionProviderToken,
  messageBusToken,
]

export class BootstrapGameData implements IBootstrapGameData {
  constructor(
    private readonly logger: ILogger,
    private readonly surfaceDefinitionProvider: ISurfaceDefinitionProvider,
    private readonly widgetDefinitionProvider: IWidgetDefinitionProvider,
    private readonly mapDefinitionProvider: IMapDefinitionProvider,
    private readonly tileSetDefinitionProvider: ITileSetDefinitionProvider,
    private readonly messageBus: IMessageBus,
  ) {}

  async execute(gameData: Game): Promise<void> {
    // surface loading = 20%
    const surfaceIds = typedKeys(gameData.surfaces)
    await Promise.all(
      surfaceIds.map((surfaceId) =>
        this.surfaceDefinitionProvider.getSurfaceDefinition(surfaceId),
      ),
    )
    this.messageBus.publish(MESSAGE_ENGINE_PROGRESS, {
      message: 'GAME.PROGRESS.LOADING',
      progress: 30,
    })

    // widget loading = 20%
    const widgetIds = typedKeys(gameData.widgets)
    await Promise.all(
      widgetIds.map((widgetId) =>
        this.widgetDefinitionProvider.getWidgetDefinition(widgetId),
      ),
    )
    this.messageBus.publish(MESSAGE_ENGINE_PROGRESS, {
      message: 'GAME.PROGRESS.LOADING',
      progress: 50,
    })

    const mapIds = typedKeys(gameData.maps ?? {})
    await Promise.all(
      mapIds.map((mapId) => this.mapDefinitionProvider.getMapDefinition(mapId)),
    )

    const tileSetIds = typedKeys(gameData.tileSets ?? {})
    await Promise.all(
      tileSetIds.map((tileSetId) =>
        this.tileSetDefinitionProvider.getTileSetDefinition(tileSetId),
      ),
    )

    this.logger.debug(
      bootstrapGameDataToken,
      'Game data loaded: surfaces: {0}, widgets: {1}, maps: {2}, tile sets: {3}',
      surfaceIds.length,
      widgetIds.length,
      mapIds.length,
      tileSetIds.length,
    )
  }
}
