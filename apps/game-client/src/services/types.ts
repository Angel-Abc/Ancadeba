import type { BootProgress } from './BootService'
import type { World } from '@ancadeba/engine'

export interface IBootService {
  getState(): string
  getProgress(): BootProgress
  subscribe(callback: (progress: BootProgress) => void): () => void
  initialize(): Promise<void>
}

export interface IWorldService {
  getWorld(): World
}

export const BootServiceLogName = 'game-client/services/BootService'
export const WorldServiceLogName = 'game-client/services/WorldService'
