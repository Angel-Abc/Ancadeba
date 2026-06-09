import { Game } from '../schemas/game'
import { Language } from '../schemas/language'
import { GameMap } from '../schemas/map'
import { NewGame } from '../schemas/newGame'
import { Surface } from '../schemas/surface'
import { TileSet } from '../schemas/tileSet'
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
export interface INewGameLoader {
  loadNewGame(newGamePath: string): Promise<NewGame>
}
export interface ILanguageLoader {
  loadLanguage(languagePath: string): Promise<Language>
}
export interface IMapLoader {
  loadMap(mapPath: string): Promise<GameMap>
}
export interface ITileSetLoader {
  loadTileSet(tileSetPath: string): Promise<TileSet>
}
