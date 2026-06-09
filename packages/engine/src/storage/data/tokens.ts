import { token } from '@ancadeba/utils'
import { IGameSessionStorage, ISurfaceDataStorage } from './types'

export const surfaceDataStorageToken = token<ISurfaceDataStorage>(
  'engine/storage/data/surfaceDataStorage',
)
export const gameSessionStorageToken = token<IGameSessionStorage>(
  'engine/storage/data/gameSessionStorage',
)
