import type { BootProgress, BootState } from './BootService'
import type { World } from '@ancadeba/engine'
import type { Surface, WidgetDefinition } from '@ancadeba/content'

export interface IBootProgressTracker {
  getState(): BootState
  getProgress(): BootProgress
  subscribe(callback: (progress: BootProgress) => void): () => void
  updateProgress(state: BootState, message: string, progress: number): void
}

export interface IBootService {
  getState(): string
  getProgress(): BootProgress
  subscribe(callback: (progress: BootProgress) => void): () => void
  initialize(): Promise<void>
}

export interface IResourceRepository {
  setSurfaces(surfaces: Surface[]): void
  getSurface(id: string): Surface | null
  getAllSurfaces(): Surface[]
  setWidgetDefinitions(definitions: WidgetDefinition[]): void
  getWidgetDefinitions(): Record<string, WidgetDefinition>
  setBootSurface(surface: Surface): void
  getBootSurface(): Surface | null
}

export interface ISurfaceSelector {
  findBootSurface(surfaces: Surface[]): Surface | null
}

export interface IWorldService {
  getWorld(): World
}

export const BootProgressTrackerLogName =
  'game-client/services/BootProgressTracker'
export const BootServiceLogName = 'game-client/services/BootService'
export const WorldServiceLogName = 'game-client/services/WorldService'
export const ResourceRepositoryLogName =
  'game-client/services/ResourceRepository'
export const SurfaceSelectorLogName = 'game-client/services/SurfaceSelector'
