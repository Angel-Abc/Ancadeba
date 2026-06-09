import { token } from '@ancadeba/utils'
import {
  IGameDefinitionProvider,
  ILanguageDefinitionProvider,
  IMapDefinitionProvider,
  INewGameDefinitionProvider,
  ISurfaceDefinitionProvider,
  ITileSetDefinitionProvider,
  ITranslationProvider,
  IWidgetDefinitionProvider,
} from './types'

export const gameDefinitionProviderToken = token<IGameDefinitionProvider>(
  'engine/providers/definition/gameDefinitionProvider',
)
export const surfaceDefinitionProviderToken = token<ISurfaceDefinitionProvider>(
  'engine/providers/definition/surfaceDefinitionProvider',
)
export const widgetDefinitionProviderToken = token<IWidgetDefinitionProvider>(
  'engine/providers/definition/widgetDefinitionProvider',
)
export const newGameDefinitionProviderToken =
  token<INewGameDefinitionProvider>(
    'engine/providers/definition/newGameDefinitionProvider',
  )
export const mapDefinitionProviderToken = token<IMapDefinitionProvider>(
  'engine/providers/definition/mapDefinitionProvider',
)
export const tileSetDefinitionProviderToken =
  token<ITileSetDefinitionProvider>(
    'engine/providers/definition/tileSetDefinitionProvider',
  )
export const languageDefinitionProviderToken =
  token<ILanguageDefinitionProvider>(
    'engine/providers/definition/languageDefinitionProvider',
  )
export const translationProviderToken = token<ITranslationProvider>(
  'engine/providers/definition/translationProvider',
)
