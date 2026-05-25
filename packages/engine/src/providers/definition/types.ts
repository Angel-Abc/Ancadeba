import { Game, GameMap, Surface, TileSet, Widget } from '@ancadeba/content'

export interface IGameDefinitionProvider {
  getGameDefinition(): Promise<Game>
}
export interface ISurfaceDefinitionProvider {
  getSurfaceDefinition(surfaceId: string): Promise<Surface>
}
export interface IWidgetDefinitionProvider {
  getWidgetDefinition(widgetId: string): Promise<Widget>
}
export interface IMapDefinitionProvider {
  getMapDefinition(mapId: string): Promise<GameMap>
}
export interface ITileSetDefinitionProvider {
  getTileSetDefinition(tileSetId: string): Promise<TileSet>
}
export interface ILanguageDefinitionProvider {
  setLanguage(languageId: string): Promise<void>
  getKeyValue(key: string): string
}
export interface ITranslationProvider {
  getTranslation(key: string): string
}
