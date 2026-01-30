import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import { gameSchema, type Game } from '../schemas/game'

export interface IGameLoader {
  load(baseUrl: string): Promise<Game>
}

export const gameLoaderDependencies: Token<unknown>[] = [loggerToken]

const logName = 'content/loaders/GameLoader'

export class GameLoader implements IGameLoader {
  constructor(private readonly logger: ILogger) {}

  async load(baseUrl: string): Promise<Game> {
    this.logger.debug(logName, 'Loading game metadata from {0}', baseUrl)

    const response = await fetch(`${baseUrl}/index.json`)

    if (!response.ok) {
      throw new Error(`Failed to load game metadata: ${response.status}`)
    }

    const data = await response.json()
    const parsed = gameSchema.parse(data)

    this.logger.debug(logName, 'Game metadata loaded: {0}', parsed)
    return parsed
  }
}
