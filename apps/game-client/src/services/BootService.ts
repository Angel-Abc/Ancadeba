import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import { gameLoaderToken, type IGameLoader } from '@ancadeba/content'
import {
  type IBootService,
  type IWorldService,
  type IBootProgressTracker,
  BootServiceLogName,
} from './types'
import { worldServiceToken, bootProgressTrackerToken } from './tokens'

export const bootServiceDependencies: Token<unknown>[] = [
  loggerToken,
  gameLoaderToken,
  worldServiceToken,
  bootProgressTrackerToken,
]

export enum BootState {
  Booting = 'booting',
  Loading = 'loading',
  Ready = 'ready',
  Error = 'error',
}

export interface BootProgress {
  state: BootState
  message: string
  progress: number
}

/**
 * Orchestrates the game client boot process.
 * Responsible only for coordinating initialization phases.
 */
export class BootService implements IBootService {
  public static readonly logName: string = BootServiceLogName

  constructor(
    private readonly logger: ILogger,
    private readonly gameLoader: IGameLoader,
    private readonly worldService: IWorldService,
    private readonly progressTracker: IBootProgressTracker,
  ) {}

  getState(): BootState {
    return this.progressTracker.getState()
  }

  getProgress(): BootProgress {
    return this.progressTracker.getProgress()
  }

  subscribe(callback: (progress: BootProgress) => void): () => void {
    return this.progressTracker.subscribe(callback)
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info(BootService.logName, 'Initializing game client')
      this.progressTracker.updateProgress(
        BootState.Booting,
        'Initializing...',
        0,
      )

      // Phase 1: Validate resources path
      this.progressTracker.updateProgress(
        BootState.Loading,
        'Validating resources...',
        0.1,
      )
      await this.delay(100) // Simulate async work

      // Phase 2: Load game metadata
      this.progressTracker.updateProgress(
        BootState.Loading,
        'Loading game data...',
        0.3,
      )
      await this.loadGameMetadata()

      // Phase 3: Initialize engine
      this.progressTracker.updateProgress(
        BootState.Loading,
        'Initializing engine...',
        0.6,
      )
      await this.initializeEngine()

      // Phase 4: Ready
      this.progressTracker.updateProgress(BootState.Ready, 'Ready!', 1.0)
      this.logger.info(
        BootService.logName,
        'Game client initialized successfully',
      )
    } catch (error) {
      this.logger.error(
        BootService.logName,
        'Failed to initialize game client: {0}',
        error,
      )
      this.progressTracker.updateProgress(
        BootState.Error,
        `Error: ${error instanceof Error ? error.message : String(error)}`,
        0,
      )
      throw error
    }
  }

  private async loadGameMetadata(): Promise<void> {
    const game = await this.gameLoader.load()
    this.logger.debug(BootService.logName, 'Game loaded: {0}', game.title)
  }

  private async initializeEngine(): Promise<void> {
    const world = this.worldService.getWorld()
    this.logger.debug(
      BootService.logName,
      'ECS World initialized with {0} entities',
      world.getEntities().length,
    )
    await this.delay(100) // Simulate async work
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
