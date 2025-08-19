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

    cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())
    }

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

