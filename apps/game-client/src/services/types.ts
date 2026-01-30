import { token } from '@ancadeba/utils'
import type { BootProgress } from './BootService'

export interface IResourcesConfiguration {
  getResourcesPath(): string
}

export interface IBootService {
  getState(): string
  getProgress(): BootProgress
  subscribe(callback: (progress: BootProgress) => void): () => void
  initialize(): Promise<void>
}

export const resourcesConfigurationToken = token<IResourcesConfiguration>(
  'game-client/services/ResourcesConfiguration',
)
export const bootServiceToken = token<IBootService>(
  'game-client/services/BootService',
)
