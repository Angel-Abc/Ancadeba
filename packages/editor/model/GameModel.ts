import { Token, token } from '@ioc/token'
import { Game } from '@loader/schema/game'
import { ILogger, loggerToken } from '@utils/logger'

export interface IGameModel {
    get title(): string
    set title(value: string)
    get description(): string
    set description(value: string)
    get version(): string
    set version(value: string)
}

export type IGameModelSet = IGameModel & {
    set game(value: Game)
    get game(): Game
}

const logName = 'GameModel'
export const gameModelToken = token<IGameModel>(logName)
export const gameModelDependencies: Token<unknown>[] = [
    loggerToken
]
export class GameModel implements IGameModelSet {
    private current: Game | null = null
    private original: Game | null = null     

    constructor(
        private logger: ILogger
    ){}

    public get game() {
        if (this.current !== null) return this.current
        const error = this.logger.error(logName, 'No game data set!')
        throw new Error(error)
    }

    public set game(value: Game) {
        this.current = value
        this.original = value
    }

    public get title(): string {
        return this.game.title
    }
    public set title(value: string) {
        this.game.title = value
    }

    public get description(): string {
        return this.game.description    
    }

    public set description(value: string) {
        this.game.description = value
    }

    public get version(): string {
        return this.game.version
    }
    public set version(value: string) {
        this.game.version = value
    }
}
