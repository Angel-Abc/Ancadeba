import { token } from '@ancadeba/utils'
import { IGameLoader, ISurfaceLoader, IWidgetLoader } from './types'

export const gameLoaderToken = token<IGameLoader>('content/loaders/gameLoader')
export const surfaceLoaderToken = token<ISurfaceLoader>(
  'content/loaders/surfaceLoader',
)
export const widgetLoaderToken = token<IWidgetLoader>(
  'content/loaders/widgetLoader',
)
export const languageLoaderToken = token<IGameLoader>(
  'content/loaders/languageLoader',
)
