import type { Game } from '@ancadeba/content'
import { ILogger, loggerToken, Token } from '@ancadeba/utils'
import { surfaceDataStorageToken } from '../storage/data/tokens'
import type { ISurfaceDataStorage } from '../storage/data/types'
import type { IBootstrapFinalizer } from './types'
import { bootstrapFinalizerToken } from './tokens'

export const bootstrapFinalizerDependencies: Token<unknown>[] = [
  loggerToken,
  surfaceDataStorageToken,
]

export class BootstrapFinalizer implements IBootstrapFinalizer {
  constructor(
    private readonly logger: ILogger,
    private readonly surfaceDataStorage: ISurfaceDataStorage,
  ) {}

  async execute(gameData: Game): Promise<void> {
    if (!gameData.startSurfaceId) {
      this.logger.warn(
        bootstrapFinalizerToken,
        'No start surface configured. Leaving current surface unchanged.',
      )
      return
    }

    this.surfaceDataStorage.surfaceId = gameData.startSurfaceId
    this.logger.debug(
      bootstrapFinalizerToken,
      'Set active surface to start surface {0}.',
      gameData.startSurfaceId,
    )
  }
}
