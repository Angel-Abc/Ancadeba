import { Token, token } from '@ioc/token'
import { GameMap } from '@loader/data/map'
import { gameMapLoaderToken, IGameMapLoader } from '@loader/gameMapLoader'
import { MAP_SWITCHED, SWITCH_MAP } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import type { ILogger } from '@utils/logger'
import { loggerToken } from '@utils/logger'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'
import { ITileSetManager, tileSetManagerToken } from './tileSetManager'

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
    loggerToken
]

/**
 * Default implementation of {@link IMapManager} that interacts with loaders,
 * the message bus and the game data provider to manage maps.
 */
export class MapManager implements IMapManager {
    private cleanupFn: CleanUp | null = null

    constructor(
        private gameMapLoader: IGameMapLoader,
        private messageBus: IMessageBus,
        private gameDataProvider: IGameDataProvider,
        private tileSetManager: ITileSetManager,
        private logger: ILogger
    ) { }

    /**
     * Removes any registered message listeners and cleans up resources.
     *
     * @remarks Invokes stored cleanup handlers, unregistering any listeners
     * and resetting the internal cleanup list. Should be called when the
     * manager is no longer needed to avoid memory leaks.
     */
    public cleanup(): void {
        const fn = this.cleanupFn
        this.cleanupFn = null
        fn?.()
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
        this.cleanupFn =
            this.messageBus.registerMessageListener(
                SWITCH_MAP,
                async message => {
                    await this.setActiveMap(message.payload as string)
                }
            )

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
        if (!path) {
            throw new Error(this.logger.error(logName, 'Map not found for id {0}', mapId))
        }

        let map: GameMap
        if (this.gameDataProvider.Game.loadedMaps[mapId] === undefined) {
            map = await this.gameMapLoader.loadMap(path)
            this.gameDataProvider.Game.loadedMaps[mapId] = map
            await this.tileSetManager.ensureTileSets(map.tileSets)
        } else {
            map = this.gameDataProvider.Game.loadedMaps[mapId]
        }

        this.gameDataProvider.Context.currentMap = {
            id: mapId,
            width: map.width,
            height: map.height
        }
        this.messageBus.postMessage({
            message: MAP_SWITCHED,
            payload: mapId
        })
    }

}
