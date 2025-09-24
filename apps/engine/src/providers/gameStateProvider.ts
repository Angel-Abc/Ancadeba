import { Token, token } from '@angelabc/utils/ioc'
import { GameState } from '../core/gameState'
import { IMessageBus, messageBusToken } from '@angelabc/utils/utils/messageBus'
import { MESSAGE_ENGINE_LOADING, MESSAGE_ENGINE_START, MESSAGE_ENGINE_STATE_CHANGED } from '../core/messages'

export interface IGameStateProvider {
    get GameState(): GameState
    initialize(): void
}

const logName = 'GameStateProvider'
export const gameStateProviderToken = token<IGameStateProvider>(logName)
export const gameStateProviderDependencies: Token<unknown>[] = [
    messageBusToken
]
export class GameStateProvider {
    private gameState: GameState = GameState.init
    constructor(
        private messageBus: IMessageBus
    ) {
    }

    private set GameState(value: GameState) {
        if (value !== this.gameState){
            this.gameState = value
            this.messageBus.postMessage({
                message: MESSAGE_ENGINE_STATE_CHANGED,
                payload: value
            })
        }
    }

    public get GameState(): GameState {
        return this.gameState
    }

    public initialize(): void {
        this.messageBus.registerMessageListener(MESSAGE_ENGINE_LOADING,
            () => { this.GameState = GameState.loading }
        )
        this.messageBus.registerMessageListener(MESSAGE_ENGINE_START,
            () => { this.GameState = GameState.running }
        )
    }
}
