import { Game } from '../schemas/game'
import { Surface } from '../schemas/surface'
import { Widget } from '../schemas/widget'

export interface IGameLoader {
  loadGame(): Promise<Game>
}
export interface ISurfaceLoader {
  loadSurface(surfacePath: string): Promise<Surface>
}
export interface IWidgetLoader {
  loadWidget(widgetPath: string): Promise<Widget>
}
