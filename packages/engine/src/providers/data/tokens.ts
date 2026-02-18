import { token } from '@ancadeba/utils'
import { ISurfaceDataProvider } from './types'

export const surfaceDataProviderToken = token<ISurfaceDataProvider>(
  'engine/providers/data/surfaceDataProvider',
)
