import { Token, token } from '@angelabc/utils/ioc'
import { IMessageBus, messageBusToken } from '@angelabc/utils/utils/messageBus'
import { MESSAGE_ENGINE_START, MESSAGE_ENGINE_STATE_CHANGED } from './messages'

export enum GameState {
    unknown = 0,
    init = 2,
    running = 3
}

export interface IGameStateProvider {
    get GameState(): GameState
}

const logName = 'GameStateProvider'
export const gameStateProviderToken = token<IGameStateProvider>(logName)
export const gameStateProviderDependencies: Token<unknown>[] = [
    messageBusToken
]
export class GameStateProvider {
    private gameState: GameState = GameState.unknown
    constructor(
        private messageBus: IMessageBus
    ) {
        messageBus.registerMessageListener(MESSAGE_ENGINE_START,
            () => { this.GameState = GameState.init }
        )
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
}
