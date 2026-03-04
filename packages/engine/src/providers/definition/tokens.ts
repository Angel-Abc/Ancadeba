import { token } from '@ancadeba/utils'
import {
  IGameDefinitionProvider,
  ILanguageDefinitionProvider,
  ISurfaceDefinitionProvider,
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
export const languageDefinitionProviderToken =
  token<ILanguageDefinitionProvider>(
    'engine/providers/definition/languageDefinitionProvider',
  )
export const translationProviderToken = token<ITranslationProvider>(
  'engine/providers/definition/translationProvider',
)
