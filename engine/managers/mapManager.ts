import { Token, token } from '@ioc/token'
import { gameMapLoaderToken, IGameMapLoader } from '@loader/gameMapLoader'
import { ITileSetLoader, tileSetLoaderToken } from '@loader/tileSetLoader'
import { MAP_SWITCHED, SWITCH_MAP } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { fatalError } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

export interface IMapManager {
    setActiveMap(mapId: string): Promise<void>
    initialize(): void
    cleanup(): void
}

const logName = 'MapManager'
export const mapManagerToken = token<IMapManager>(logName)
export const mapManagerDependencies: Token<unknown>[] = [
    gameMapLoaderToken, 
    messageBusToken,
    gameDataProviderToken,
    tileSetLoaderToken
]
export class MapManager implements IMapManager {
    private cleanupFns: CleanUp[] | null = null

    constructor(
        private gameMapLoader: IGameMapLoader,
        private messageBus: IMessageBus,
        private gameDataProvider: IGameDataProvider,
        private tileSetLoader: ITileSetLoader
    ){}

    public cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())        
    }

    public initialize(): void {
        this.cleanupFns = [
            this.messageBus.registerMessageListener(
                SWITCH_MAP,
                async message => {
                    await this.setActiveMap(message.payload as string)
                }
            )
        ]   
    }

    public async setActiveMap(mapId: string): Promise<void> {
        const path = this.gameDataProvider.Game.game.maps[mapId]
        if (!path) fatalError(logName, 'Map not found for id {0}', mapId)

        if (this.gameDataProvider.Game.loadedMaps[mapId] === undefined){
            const map = await this.gameMapLoader.loadMap(path)
            this.gameDataProvider.Game.loadedMaps[mapId] = map
            await this.ensureTileSets(map.tileSets)
        }

        this.gameDataProvider.Context.currentMapId = mapId
        this.messageBus.postMessage({
            message: MAP_SWITCHED,
            payload: mapId
        })
    }

    public async ensureTileSets(tileSetIds: string[]): Promise<void> {
        await Promise.all(
            tileSetIds.map(async tileSetId => {
                const path = this.gameDataProvider.Game.game.tiles[tileSetId]
                if (!path) fatalError(logName, 'Tile set not found for id {0}', tileSetId)

                if (this.gameDataProvider.Game.loadedTileSets[tileSetId] === undefined) {
                    const tileSet = await this.tileSetLoader.loadTileSet(path)
                    this.gameDataProvider.Game.loadedTileSets[tileSetId] = tileSet
                }
            })
        )
    }
}
