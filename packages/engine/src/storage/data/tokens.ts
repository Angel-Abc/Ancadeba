import { token } from '@ancadeba/utils'
import { ISurfaceDataStorage } from './types'

export const surfaceDataStorageToken = token<ISurfaceDataStorage>(
  'engine/storage/data/surfaceDataStorage',
)
