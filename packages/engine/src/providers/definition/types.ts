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
