import type { Game } from '@ancadeba/content'

export interface IBootstrapEngine {
  execute(): Promise<void>
}

export interface IBootstrapBootSurface {
  execute(bootSurfaceId: string): Promise<void>
}

export interface IBootstrapGameDefinition {
  execute(gameData: Game): Promise<void>
}
