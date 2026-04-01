import { IMessageBus, messageBusToken, Token } from '@ancadeba/utils'
import { IUIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'
import { IGameDefinitionProvider } from '../providers/definition/types'
import { gameDefinitionProviderToken } from '../providers/definition/tokens'
import {
  IBootstrapBootSurface,
  IBootstrapEngine,
  IBootstrapFinalizer,
  IBootstrapGameData,
  IBootstrapGameDefinition,
} from './types'
import {
  bootstrapBootSurfaceToken,
  bootstrapFinalizerToken,
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
  bootstrapFinalizerToken,
  messageBusToken,
]
export class BootstrapEngine implements IBootstrapEngine {
  constructor(
    private readonly uiReadySignal: IUIReadySignal,
    private readonly gameDefinitionProvider: IGameDefinitionProvider,
    private readonly bootstrapGameDefinition: IBootstrapGameDefinition,
    private readonly bootstrapBootSurface: IBootstrapBootSurface,
    private readonly bootstrapGameData: IBootstrapGameData,
    private readonly bootstrapFinalizer: IBootstrapFinalizer,
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

    this.messageBus.publish(MESSAGE_ENGINE_PROGRESS, {
      message: 'GAME.PROGRESS.LOADING',
      progress: 10,
    })

    // we can continue with the rest of the boot process
    await this.bootstrapGameData.execute(gameData)

    this.messageBus.publish(MESSAGE_ENGINE_PROGRESS, {
      message: 'GAME.PROGRESS.LOADING',
      progress: 100,
    })

    await this.bootstrapFinalizer.execute(gameData)
  }
}
