import { Token, token } from '@ioc/token'
import { Position } from '@loader/data/map'
import { gameMapLoaderToken, IGameMapLoader } from '@loader/gameMapLoader'
import { CHANGE_POSITION, MAP_SWITCHED, SWITCH_MAP } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { fatalError } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { ITileSetManager, tileSetManagerToken } from './tileSetManager'
import { IPlayerPositionManager, playerPositionManagerToken } from './playerPositionManager'

/**
 * Coordinates loading and activation of maps within the game engine.
 * Implementations are responsible for handling map switching and
 * ensuring required tile sets are available.
 */
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
    tileSetManagerToken,
    playerPositionManagerToken
]

/**
 * Default implementation of {@link IMapManager} that interacts with loaders,
 * the message bus and the game data provider to manage maps.
 */
export class MapManager implements IMapManager {
    private cleanupFns: CleanUp[] | null = null

    constructor(
        private gameMapLoader: IGameMapLoader,
        private messageBus: IMessageBus,
        private gameDataProvider: IGameDataProvider,
        private tileSetManager: ITileSetManager,
        private playerPositionManager: IPlayerPositionManager
    ){}

    /**
     * Removes any registered message listeners and cleans up resources.
     *
     * @remarks Invokes stored cleanup handlers, unregistering any listeners
     * and resetting the internal cleanup list. Should be called when the
     * manager is no longer needed to avoid memory leaks.
     */
    public cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())
    }

    /**
     * Registers listeners required for map management.
     *
     * @remarks Attaches listeners for {@link SWITCH_MAP} and
     * {@link CHANGE_POSITION} messages to the message bus and records the
     * corresponding cleanup functions for later removal.
     */
    public initialize(): void {
        this.cleanup()
        this.cleanupFns = [
            this.messageBus.registerMessageListener(
                SWITCH_MAP,
                async message => {
                    await this.setActiveMap(message.payload as string)
                }
            ),
            this.messageBus.registerMessageListener(
                CHANGE_POSITION,
                message => {
                    this.playerPositionManager.changePosition(message.payload as Position)
                }
            )
        ]
    }

    /**
     * Loads and activates a map by its identifier.
     *
     * @param mapId - Unique identifier of the map to activate.
     * @returns A promise that resolves once the map is loaded and activated.
     * @remarks Side effects: loads missing maps and tile sets into the game
     * data provider, updates the current map context and posts a
     * {@link MAP_SWITCHED} message on the bus.
     */
    public async setActiveMap(mapId: string): Promise<void> {
        const path = this.gameDataProvider.Game.game.maps[mapId]
        if (!path) fatalError(logName, 'Map not found for id {0}', mapId)

        if (this.gameDataProvider.Game.loadedMaps[mapId] === undefined){
            const map = await this.gameMapLoader.loadMap(path)
            this.gameDataProvider.Game.loadedMaps[mapId] = map
            await this.tileSetManager.ensureTileSets(map.tileSets)
        }

        this.gameDataProvider.Context.currentMapId = mapId
        this.messageBus.postMessage({
            message: MAP_SWITCHED,
            payload: mapId
        })
    }

}
