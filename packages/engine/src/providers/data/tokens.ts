import { token } from '@ancadeba/utils'
import { IGameSessionProvider, ISurfaceDataProvider } from './types'

export const surfaceDataProviderToken = token<ISurfaceDataProvider>(
  'engine/providers/data/surfaceDataProvider',
)
export const gameSessionProviderToken = token<IGameSessionProvider>(
  'engine/providers/data/gameSessionProvider',
)
