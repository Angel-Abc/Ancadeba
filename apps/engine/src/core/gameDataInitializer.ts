import { Token, token } from '@ancadeba/utils'
import type { GameData, Tile } from '@ancadeba/schemas'
import {
  IGameStateStorage,
  gameStateStorageToken,
} from '../gameState.ts/storage'
import {
  IResourceDataStorage,
  resourceDataStorageToken,
} from '../resourceData/storage'

export interface IGameDataInitializer {
  initialize(gameData: GameData): void
}

const logName = 'engine/core/gameDataInitializer'
export const gameDataInitializerToken = token<IGameDataInitializer>(logName)
export const gameDataInitializerDependencies: Token<unknown>[] = [
  gameStateStorageToken,
  resourceDataStorageToken,
]

export class GameDataInitializer implements IGameDataInitializer {
  constructor(
    private readonly gameStateStorage: IGameStateStorage,
    private readonly resourceDataStorage: IResourceDataStorage
  ) {}

  initialize(gameData: GameData): void {
    const { scene: initialScene, ...initialState } = gameData.meta.initialState
    this.gameStateStorage.state = {
      title: gameData.meta.title,
      activeScene: initialScene,
      flags: {},
      sceneStack: [initialScene],
      ...initialState,
    }

    gameData.scenes.forEach((scene) => {
      this.resourceDataStorage.addSceneData(scene.id, scene)
    })
    gameData.meta.styling?.forEach((fileName) => {
      this.resourceDataStorage.addCssFileName(fileName)
    })
    gameData.tileSets.forEach((tileSet) => {
      tileSet.tiles.forEach((tile) => {
        const tileId = `${tileSet.id}.${tile.id}`
        this.resourceDataStorage.addTileData(tileId, tile)
      })
    })
    gameData.maps.forEach((map) => {
      this.resourceDataStorage.addMapData(map.id, {
        id: map.id,
        width: map.width,
        height: map.height,
        tiles: new Map<string, Tile>(
          map.tiles.map((tile) => [
            tile.key,
            this.resourceDataStorage.getTileData(tile.tile),
          ])
        ),
        squares: map.map.map((row) => row.split(',')),
      })
    })

    this.resourceDataStorage.logResourceData()
  }
}
