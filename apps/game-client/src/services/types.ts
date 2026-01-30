import type { BootProgress, BootState } from './BootService'
import type { World } from '@ancadeba/engine'

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

export interface IWorldService {
  getWorld(): World
}

export const BootProgressTrackerLogName =
  'game-client/services/BootProgressTracker'
export const BootServiceLogName = 'game-client/services/BootService'
export const WorldServiceLogName = 'game-client/services/WorldService'
