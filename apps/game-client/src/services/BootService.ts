import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import {
  gameLoaderToken,
  type IGameLoader,
  surfaceLoaderToken,
  type ISurfaceLoader,
  type Surface,
} from '@ancadeba/content'
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
  surfaceLoaderToken,
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

  private bootSurface: Surface | null = null
  private initializationPromise: Promise<void> | null = null

  constructor(
    private readonly logger: ILogger,
    private readonly gameLoader: IGameLoader,
    private readonly surfaceLoader: ISurfaceLoader,
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

  getBootSurface(): Surface | null {
    return this.bootSurface
  }

  initialize(): Promise<void> {
    // Guard: Return existing promise if already initializing or initialized
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Guard: Don't re-initialize if already ready or in error state
    const currentState = this.progressTracker.getState()
    if (currentState === BootState.Ready || currentState === BootState.Error) {
      this.logger.debug(
        BootService.logName,
        'Skipping initialization, already in state: {0}',
        currentState,
      )
      return Promise.resolve()
    }

    this.initializationPromise = this.performInitialization()
    return this.initializationPromise
  }

  private async performInitialization(): Promise<void> {
    try {
      this.logger.info(BootService.logName, 'Initializing game client')
      this.progressTracker.updateProgress(
        BootState.Booting,
        'Initializing...',
        0,
      )

      // Phase 1: Load game metadata
      this.progressTracker.updateProgress(
        BootState.Loading,
        'Loading game data...',
        0.1,
      )
      const game = await this.gameLoader.load()
      this.logger.debug(BootService.logName, 'Game loaded: {0}', game.title)

      // Phase 2: Load surfaces and find boot surface
      this.progressTracker.updateProgress(
        BootState.Loading,
        'Loading surfaces...',
        0.3,
      )
      await this.loadBootSurface(game.surfaces ?? [])

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

  private async loadBootSurface(surfacePaths: string[]): Promise<void> {
    if (surfacePaths.length === 0) {
      throw new Error('No surfaces defined in game metadata')
    }

    const surfaces = await this.surfaceLoader.loadAll(surfacePaths)

    // Find boot surface by capability: requires 'boot:progress', forbids 'ecs:projections'
    this.bootSurface =
      surfaces.find(
        (s) =>
          s.requires?.includes('boot:progress') &&
          ((s.forbids ?? []).includes('ecs:projections') ||
            !(s.requires ?? []).includes('ecs:projections')),
      ) ?? null

    if (!this.bootSurface) {
      throw new Error(
        'No boot surface found (must require "boot:progress" and forbid "ecs:projections")',
      )
    }

    this.logger.debug(
      BootService.logName,
      'Boot surface loaded: {0}',
      this.bootSurface.id,
    )
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
