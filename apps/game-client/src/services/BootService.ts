import { loggerToken, type ILogger, type Token } from '@ancadeba/utils'
import {
  gameLoaderToken,
  type IGameLoader,
  surfaceLoaderToken,
  type ISurfaceLoader,
  widgetLoaderToken,
  type IWidgetLoader,
} from '@ancadeba/content'
import {
  type IBootService,
  type IWorldService,
  type IBootProgressTracker,
  type IResourceRepository,
  type ISurfaceSelector,
  BootServiceLogName,
} from './types'
import {
  worldServiceToken,
  bootProgressTrackerToken,
  resourceRepositoryToken,
  surfaceSelectorToken,
} from './tokens'

export const bootServiceDependencies: Token<unknown>[] = [
  loggerToken,
  gameLoaderToken,
  surfaceLoaderToken,
  widgetLoaderToken,
  worldServiceToken,
  bootProgressTrackerToken,
  resourceRepositoryToken,
  surfaceSelectorToken,
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
 * Single responsibility: Coordinating initialization phases.
 */
export class BootService implements IBootService {
  public static readonly logName: string = BootServiceLogName

  private initializationPromise: Promise<void> | null = null

  private readonly logger: ILogger
  private readonly gameLoader: IGameLoader
  private readonly surfaceLoader: ISurfaceLoader
  private readonly widgetLoader: IWidgetLoader
  private readonly worldService: IWorldService
  private readonly progressTracker: IBootProgressTracker
  private readonly resourceRepository: IResourceRepository
  private readonly surfaceSelector: ISurfaceSelector

  constructor(deps: {
    logger: ILogger
    gameLoader: IGameLoader
    surfaceLoader: ISurfaceLoader
    widgetLoader: IWidgetLoader
    worldService: IWorldService
    bootProgressTracker: IBootProgressTracker
    resourceRepository: IResourceRepository
    surfaceSelector: ISurfaceSelector
  }) {
    this.logger = deps.logger
    this.gameLoader = deps.gameLoader
    this.surfaceLoader = deps.surfaceLoader
    this.widgetLoader = deps.widgetLoader
    this.worldService = deps.worldService
    this.progressTracker = deps.bootProgressTracker
    this.resourceRepository = deps.resourceRepository
    this.surfaceSelector = deps.surfaceSelector
  }

  getState(): BootState {
    return this.progressTracker.getState()
  }

  getProgress(): BootProgress {
    return this.progressTracker.getProgress()
  }

  subscribe(callback: (progress: BootProgress) => void): () => void {
    return this.progressTracker.subscribe(callback)
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

      await this.loadGameAndResources()

      this.progressTracker.updateProgress(
        BootState.Loading,
        'Initializing engine...',
        0.7,
      )
      await this.initializeEngine()

      this.progressTracker.updateProgress(BootState.Ready, 'Ready!', 1.0)
      this.logger.info(
        BootService.logName,
        'Game client initialized successfully',
      )
    } catch (error) {
      this.handleInitializationError(error)
    }
  }

  private async loadGameAndResources(): Promise<void> {
    // Load game metadata
    this.progressTracker.updateProgress(
      BootState.Loading,
      'Loading game data...',
      0.1,
    )
    const game = await this.gameLoader.load()
    this.logger.debug(BootService.logName, 'Game loaded: {0}', game.title)

    // Load widgets from game metadata
    this.progressTracker.updateProgress(
      BootState.Loading,
      'Loading widgets...',
      0.2,
    )
    await this.loadWidgets(game.widgets ?? [])

    // Load surfaces and find boot surface
    this.progressTracker.updateProgress(
      BootState.Loading,
      'Loading surfaces...',
      0.4,
    )
    await this.loadBootSurface(game.surfaces ?? [])
  }

  private handleInitializationError(error: unknown): void {
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

  private async loadWidgets(widgetPaths: string[]): Promise<void> {
    if (widgetPaths.length === 0) {
      this.logger.debug(
        BootService.logName,
        'No widgets defined in game metadata',
      )
      return
    }

    const widgets = await this.widgetLoader.loadAll(widgetPaths)
    this.resourceRepository.setWidgetDefinitions(widgets)

    this.logger.debug(
      BootService.logName,
      'Loaded {0} widgets: {1}',
      widgets.length,
      widgets.map((w) => w.id).join(', '),
    )
  }

  private async loadBootSurface(surfacePaths: string[]): Promise<void> {
    if (surfacePaths.length === 0) {
      throw new Error('No surfaces defined in game metadata')
    }

    const surfaces = await this.surfaceLoader.loadAll(surfacePaths)

    // Store all surfaces
    this.resourceRepository.setSurfaces(surfaces)

    // Find and store boot surface
    const bootSurface = this.surfaceSelector.findBootSurface(surfaces)
    if (!bootSurface) {
      throw new Error(
        'No boot surface found (must require "boot:progress" and forbid "ecs:projections")',
      )
    }
    this.resourceRepository.setBootSurface(bootSurface)

    this.logger.debug(
      BootService.logName,
      'Boot surface loaded: {0}',
      bootSurface.id,
    )
    this.logger.debug(
      BootService.logName,
      'All surfaces loaded: {0}',
      surfaces.map((s) => s.id).join(', '),
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
