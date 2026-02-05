import { Token } from '@ancadeba/utils'
import { IGameDefinitionProvider } from './types'
import { Game, gameLoaderToken, IGameLoader } from '@ancadeba/content'

export const gameDefinitionProviderDependencies: Token<unknown>[] = [
  gameLoaderToken,
]
export class gameDefinitionProvider implements IGameDefinitionProvider {
  private game: Game | null = null

  constructor(private readonly gameLoader: IGameLoader) {}

  async getGameDefinition(): Promise<Game> {
    if (this.game) {
      return this.game
    }
    this.game = await this.gameLoader.loadGame()
    return this.game
  }
}
