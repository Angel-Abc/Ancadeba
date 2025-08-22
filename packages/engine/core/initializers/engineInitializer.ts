import { Token, token } from '@ioc/token'
import { coreInitializerToken, ICoreInitializer } from './coreInitializers'
import { gameLoaderToken, IGameLoader } from '@loader/gameLoader'
import { Game } from '@loader/data/game'
import { ILogger, loggerToken } from '@utils/logger'
import { engineStartInitializerToken, IEngineStartInitializer } from './engineStartInitializer'
import { IProvidersInitializer, providersInitializerToken } from './providersInitializer'
import { IManagersInitializer, managersInitializerToken } from './managersInitializer'
import { IRegistriesInitializer, registriesInitializerToken } from './registriesInitializers'

export interface IInitializer {
    initialize(): Promise<void>
}

export type IEngineInitializer = IInitializer

const logName = 'EngineInitializer'
export const engineInitializerToken = token<IEngineInitializer>(logName)
export const engineInitializerDependencies: Token<unknown>[] = [
    loggerToken,
    coreInitializerToken,
    providersInitializerToken,
    managersInitializerToken,
    engineStartInitializerToken,
    gameLoaderToken,
    registriesInitializerToken    
]
export class EngineInitializer implements IEngineInitializer {
    constructor(
        private logger: ILogger,
        private coreInitializer: ICoreInitializer,
        private providersInitializer: IProvidersInitializer,
        private managersInitializer: IManagersInitializer,
        private engineStartInitializer: IEngineStartInitializer,
        private gameLoader: IGameLoader,
        private registriesInitializer: IRegistriesInitializer
    ) { }

    public async initialize(): Promise<void> {
        const game = await this.loadGameDataRoot()
        await this.registriesInitializer.initialize()
        await this.coreInitializer.initialize(game)
        await this.providersInitializer.initialize(game)
        await this.managersInitializer.initialize()
        await this.engineStartInitializer.initialize(game.initialData)
    }

    private async loadGameDataRoot(): Promise<Game> {
        const game = await this.gameLoader.loadGame()
        if (!game) {

            throw new Error(this.logger.error(logName, 'Game data is null or undefined'))
        }
        this.logger.debug(logName, 'Game loaded with data {0}', game)
        return game
    }

}
