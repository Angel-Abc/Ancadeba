import { actionExecutorToken, IActionExecutor } from '@actions/actionExecutor'
import { Token, token } from '@ioc/token'
import type { GameMap, Position } from '@loader/data/map'
import { CHANGING_POSITION, POSITION_CHANGED } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import type { Message, CleanUp } from '@utils/types'

/**
 * Triggers tile actions when the player moves.
 */
export interface ITileTriggerManager {
    initialize(): void
    cleanup(): void
}

const logName = 'TileTriggerManager'
export const tileTriggerManagerToken = token<ITileTriggerManager>(logName)
export const tileTriggerManagerDependencies: Token<unknown>[] = [
    gameDataProviderToken,
    messageBusToken,
    actionExecutorToken
]

/**
 * Listens for player position changes and executes tile actions on entry.
 */
export class TileTriggerManager implements ITileTriggerManager {
    private cleanupFns: CleanUp[] | null = null

    constructor(
        private gameDataProvider: IGameDataProvider,
        private messageBus: IMessageBus,
        private actionExecutor: IActionExecutor
    ) { }

    /**
     * Registers listeners for position change messages and wires them to
     * handlers that execute tile actions. Existing listeners are removed
     * before new ones are added.
     */
    public initialize(): void {
        this.cleanup()
        this.cleanupFns = [
            this.messageBus.registerMessageListener(
                POSITION_CHANGED,
                message => {
                    const position = message.payload as Position
                    this.handlePositionChange(position, message)
                }
            ),
            this.messageBus.registerMessageListener(
                CHANGING_POSITION,
                message => {
                    const position = message.payload as Position
                    this.preparePositionChange(position, message)
                }
            )
        ]
    }

    /**
     * Removes any registered message listeners used for tile action triggers.
     */
    cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())
    }

    /**
     * Executes a tile's `onExit` actions when the player is about to leave a
     * given position.
     *
     * @param position - The position the player is moving away from.
     * @param message - The message associated with the move, forwarded to
     *   executed actions.
     * @returns Nothing. Actions run only when the current map and the tile at
     *   the provided position define `onExit` behavior.
     */
    private preparePositionChange(position: Position, message: Message<unknown>): void {
        const currentMapId = this.gameDataProvider.Context.currentMap.id
        if (!currentMapId) return
        const map = this.gameDataProvider.Game.loadedMaps[currentMapId] as GameMap | undefined
        if (!map) return
        const row = map.map[position.y]
        if (!row) return
        const tileKey = row[position.x]
        if (!tileKey) return
        const tile = map.tiles[tileKey]
        const onExit = tile?.onExit
        if (!onExit) return
        const actions = Array.isArray(onExit) ? onExit : [onExit]
        actions.forEach(action => this.actionExecutor.execute(action, message))
    }

    /**
     * Executes a tile's `onEnter` actions when the player moves into a new
     * position.
     *
     * @param position - The position the player has moved to.
     * @param message - The message describing the position change, forwarded
     *   to executed actions.
     * @returns Nothing. Actions run only when the current map and the tile at
     *   the provided position define `onEnter` behavior.
     */
    private handlePositionChange(position: Position, message: Message<unknown>): void {
        const currentMapId = this.gameDataProvider.Context.currentMap.id
        if (!currentMapId) return
        const map = this.gameDataProvider.Game.loadedMaps[currentMapId] as GameMap | undefined
        if (!map) return
        const row = map.map[position.y]
        if (!row) return
        const tileKey = row[position.x]
        if (!tileKey) return
        const tile = map.tiles[tileKey]
        const onEnter = tile?.onEnter
        if (!onEnter) return
        const actions = Array.isArray(onEnter) ? onEnter : [onEnter]
        actions.forEach(action => this.actionExecutor.execute(action, message))
    }
}

