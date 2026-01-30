import { token } from '@ancadeba/utils'
import {
  type IGameLoader,
  type ISurfaceLoader,
  GameLoaderLogName,
  SurfaceLoaderLogName,
} from './types'

export const gameLoaderToken = token<IGameLoader>(GameLoaderLogName)
export const surfaceLoaderToken = token<ISurfaceLoader>(SurfaceLoaderLogName)
