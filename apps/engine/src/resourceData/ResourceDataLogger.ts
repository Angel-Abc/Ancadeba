import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { ISceneDataStorage, sceneDataStorageToken } from './sceneDataStorage'
import { ITileDataStorage, tileDataStorageToken } from './tileDataStorage'
import { IMapDataStorage, mapDataStorageToken } from './mapDataStorage'
import { ICssFileStorage, cssFileStorageToken } from './assetFileStorage'

export interface IResourceDataLogger {
  logResourceData(): void
}

const logName = 'engine/resourceData/ResourceDataLogger'
export const resourceDataLoggerToken = token<IResourceDataLogger>(logName)
export const resourceDataLoggerDependencies: Token<unknown>[] = [
  loggerToken,
  sceneDataStorageToken,
  tileDataStorageToken,
  mapDataStorageToken,
  cssFileStorageToken,
]

export class ResourceDataLogger implements IResourceDataLogger {
  constructor(
    private readonly logger: ILogger,
    private readonly sceneDataStorage: ISceneDataStorage,
    private readonly tileDataStorage: ITileDataStorage,
    private readonly mapDataStorage: IMapDataStorage,
    private readonly cssFileStorage: ICssFileStorage
  ) {}

  logResourceData(): void {
    const sceneIds = this.sceneDataStorage.getLoadedSceneIds()
    const tileIds = this.tileDataStorage.getLoadedTileIds()
    const mapIds = this.mapDataStorage.getLoadedMapIds()
    const cssFiles = this.cssFileStorage.getCssFileNames()

    this.logger.debug(logName, 'Scenes loaded: {0}', sceneIds)
    this.logger.debug(logName, 'Tiles loaded: {0}', tileIds)
    this.logger.debug(logName, 'Maps loaded: {0}', mapIds)
    this.logger.debug(logName, 'CSS files loaded: {0}', cssFiles)
  }
}
