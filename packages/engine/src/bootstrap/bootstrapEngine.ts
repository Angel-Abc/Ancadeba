import { IMessageBus, messageBusToken, Token } from '@ancadeba/utils'
import { IUIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'
import { IGameDefinitionProvider } from '../providers/definition/types'
import { gameDefinitionProviderToken } from '../providers/definition/tokens'
import {
  IBootstrapBootSurface,
  IBootstrapEngine,
  IBootstrapGameData,
  IBootstrapGameDefinition,
} from './types'
import {
  bootstrapBootSurfaceToken,
  bootstrapGameDataToken,
  bootstrapGameDefinitionToken,
} from './tokens'
import {
  MESSAGE_ENGINE_BOOT_SURFACE_PRELOADED,
  MESSAGE_ENGINE_PROGRESS,
} from './messages'

export const bootstrapEngineDependencies: Token<unknown>[] = [
  uiReadySignalToken,
  gameDefinitionProviderToken,
  bootstrapGameDefinitionToken,
  bootstrapBootSurfaceToken,
  bootstrapGameDataToken,
  messageBusToken,
]
export class BootstrapEngine implements IBootstrapEngine {
  constructor(
    private readonly uiReadySignal: IUIReadySignal,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly bootstrapGameDefinition: IBootstrapGameDefinition,
    private readonly bootstrapBootSurface: IBootstrapBootSurface,
    private readonly bootstrapGameData: IBootstrapGameData,
    private readonly messageBus: IMessageBus,
  ) {}

  async execute(): Promise<void> {
    const gameData = await this.gameDefinitionProvider.getGameDefinition()
    if (!gameData.bootSurfaceId) {
      return
    }

    await this.bootstrapGameDefinition.execute(gameData)
    await this.bootstrapBootSurface.execute(gameData.bootSurfaceId)

    await this.uiReadySignal.ready
    this.messageBus.publish(MESSAGE_ENGINE_BOOT_SURFACE_PRELOADED)

    // TODO: switch to the first game surface after preLoad is done. This is normally the menu screen.
    this.messageBus.publish(MESSAGE_ENGINE_PROGRESS, {
      message: 'GAME.PROGRESS.LOADING',
      progress: 10,
    })

    // we can continue with the rest of the boot process, but for now we just want to show the progress widget working
    await this.bootstrapGameData.execute(gameData)

    // Simulate some loading time for the progress widget to show the progress
    this.messageBus.publish(MESSAGE_ENGINE_PROGRESS, {
      message: 'GAME.PROGRESS.LOADING',
      progress: 100,
    })
  }
}
