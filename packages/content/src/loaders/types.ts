import { token } from '@ancadeba/utils'
import type { IGameLoader } from '../loaders/GameLoader'
import type { ISurfaceLoader } from '../loaders/SurfaceLoader'

export const gameLoaderToken = token<IGameLoader>('content/loaders/GameLoader')
export const surfaceLoaderToken = token<ISurfaceLoader>(
  'content/loaders/SurfaceLoader',
)
