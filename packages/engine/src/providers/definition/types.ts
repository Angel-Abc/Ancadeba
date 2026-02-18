import { Game, Surface, Widget } from '@ancadeba/content'

export interface IGameDefinitionProvider {
  getGameDefinition(): Promise<Game>
}
export interface ISurfaceDefinitionProvider {
  getSurfaceDefinition(surfaceId: string): Promise<Surface>
}
export interface IWidgetDefinitionProvider {
  getWidgetDefinition(widgetId: string): Promise<Widget>
}
export interface ILanguageDefinitionProvider {
  setLanguage(languageId: string): Promise<void>
  getKeyValue(key: string): string
}
export interface ITranslationProvider {
  getTranslation(key: string): string
}
