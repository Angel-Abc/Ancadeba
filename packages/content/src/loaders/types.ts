import type { Game } from '../schemas/game'
import type { Surface, WidgetDefinition } from '../schemas/surface'

export interface IGameLoader {
  load(): Promise<Game>
}

export interface ISurfaceLoader {
  load(surfacePath: string): Promise<Surface>
  loadAll(surfacePaths: string[]): Promise<Surface[]>
}

export interface IWidgetLoader {
  load(widgetPath: string): Promise<WidgetDefinition>
  loadAll(widgetPaths: string[]): Promise<WidgetDefinition[]>
}

export const GameLoaderLogName = 'content/loaders/GameLoader'
export const SurfaceLoaderLogName = 'content/loaders/SurfaceLoader'
export const WidgetLoaderLogName = 'content/loaders/WidgetLoader'
