import type { Game } from '../schemas/game'
import type { Surface } from '../schemas/surface'

export interface IGameLoader {
  load(): Promise<Game>
}

export interface ISurfaceLoader {
  load(surfacePath: string): Promise<Surface>
  loadAll(surfacePaths: string[]): Promise<Surface[]>
}

export const GameLoaderLogName = 'content/loaders/GameLoader'
export const SurfaceLoaderLogName = 'content/loaders/SurfaceLoader'
