import type { BootProgress } from './BootService'

export interface IBootService {
  getState(): string
  getProgress(): BootProgress
  subscribe(callback: (progress: BootProgress) => void): () => void
  initialize(): Promise<void>
}

export const BootServiceLogName = 'game-client/services/BootService'
