import { token } from '@ancadeba/utils'
import type { IGameStyleLoader } from './types'

export const gameStyleLoaderToken = token<IGameStyleLoader>(
  'engine/styling/gameStyleLoader',
)
