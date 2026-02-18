// load the absolute minimum to get the boot screen up and running (if defined)

import { Token, token } from '@ancadeba/utils'
import { IUIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'
import {
  gameDefinitionProviderToken,
  IGameDefinitionProvider,
} from '@ancadeba/engine'
import { IGameInitializer, gameInitializerToken } from './gameInitializer'
import {
  IBootSurfacePreloader,
  bootSurfacePreloaderToken,
} from './bootSurfacePreloader'

export interface IBootLoader {
  loadBootScreen(): Promise<void>
}

export const bootLoaderToken = token<IBootLoader>(
  'game-client/services/bootLoader',
)
export const bootLoaderDependencies: Token<unknown>[] = [
  uiReadySignalToken,
  gameDefinitionProviderToken,
  gameInitializerToken,
  bootSurfacePreloaderToken,
]
export class BootLoader implements IBootLoader {
  constructor(
    private readonly uiReadySignal: IUIReadySignal,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly gameInitializer: IGameInitializer,
    private readonly bootSurfacePreloader: IBootSurfacePreloader,
  ) {}

  async loadBootScreen(): Promise<void> {
    const gameData = await this.gameDefinitionProvider.getGameDefinition()
    if (!gameData.bootSurfaceId) {
      // no boot surface defined, skip boot surface rendering
      return
    }

    await this.gameInitializer.initialize(gameData)
    await this.bootSurfacePreloader.preload(gameData.bootSurfaceId)

    // wait for the UI to be ready
    await this.uiReadySignal.ready
  }
}
