import { Token, token } from '@angelabc/utils/ioc'
import { GameData } from './data/gameData'
import { IJsonDataLoader, jsonDataLoaderToken } from '@angelabc/schemas/loaders'

export interface IGameDataLoader {
    loadGameData(): Promise<GameData>
}

const logName = 'GameDataLoader'
export const gameDataLoaderToken = token<IGameDataLoader>(logName)
export const gameDataLoaderDependencies: Token<unknown>[] = [
    jsonDataLoaderToken
]
export class GameDataLoader implements IGameDataLoader {
    constructor(
        private jsonDataLoader: IJsonDataLoader
    ) { }

    public async loadGameData(): Promise<GameData> {

        const jsonData = await this.jsonDataLoader.loadJsonData()
        const result = {
            name: jsonData.meta.name
        }
        return result
    }
}