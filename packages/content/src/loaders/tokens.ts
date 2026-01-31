import { token } from '@ancadeba/utils'
import {
  type IGameLoader,
  type ISurfaceLoader,
  type IWidgetLoader,
  GameLoaderLogName,
  SurfaceLoaderLogName,
  WidgetLoaderLogName,
} from './types'

export const gameLoaderToken = token<IGameLoader>(GameLoaderLogName)
export const surfaceLoaderToken = token<ISurfaceLoader>(SurfaceLoaderLogName)
export const widgetLoaderToken = token<IWidgetLoader>(WidgetLoaderLogName)
