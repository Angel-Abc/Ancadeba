import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import { gameLoaderToken, type IGameLoader } from '@ancadeba/content'
import {
  type IBootService,
  type IWorldService,
  BootServiceLogName,
} from './types'
import { worldServiceToken } from './tokens'

export const bootServiceDependencies: Token<unknown>[] = [
  loggerToken,
  gameLoaderToken,
  worldServiceToken,
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

export class BootService implements IBootService {
  public static readonly logName: string = BootServiceLogName

  private state: BootState = BootState.Booting
  private message: string = 'Starting...'
  private progress: number = 0
  private subscribers: Set<(progress: BootProgress) => void> = new Set()

  constructor(
    private readonly logger: ILogger,
    private readonly gameLoader: IGameLoader,
    private readonly worldService: IWorldService,
  ) {}

  getState(): BootState {
    return this.state
  }

  getProgress(): BootProgress {
    return {
      state: this.state,
      message: this.message,
      progress: this.progress,
    }
  }

  subscribe(callback: (progress: BootProgress) => void): () => void {
    this.subscribers.add(callback)
    // Immediately notify with current state
    callback(this.getProgress())
    return () => {
      this.subscribers.delete(callback)
    }
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info(BootService.logName, 'Initializing game client')
      this.updateProgress(BootState.Booting, 'Initializing...', 0)

      // Phase 1: Validate resources path
      this.updateProgress(BootState.Loading, 'Validating resources...', 0.1)
      await this.delay(100) // Simulate async work

      // Phase 2: Load game metadata
      this.updateProgress(BootState.Loading, 'Loading game data...', 0.3)
      await this.loadGameMetadata()

      // Phase 3: Initialize engine
      this.updateProgress(BootState.Loading, 'Initializing engine...', 0.6)
      await this.initializeEngine()

      // Phase 4: Ready
      this.updateProgress(BootState.Ready, 'Ready!', 1.0)
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
      this.updateProgress(
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

  private updateProgress(
    state: BootState,
    message: string,
    progress: number,
  ): void {
    this.state = state
    this.message = message
    this.progress = progress

    const currentProgress = this.getProgress()
    this.subscribers.forEach((callback) => callback(currentProgress))
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
