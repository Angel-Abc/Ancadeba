import { token } from '@ancadeba/utils'
import {
  IBootstrapBootSurface,
  IBootstrapEngine,
  IBootstrapGameDefinition,
} from './types'

export const bootstrapEngineToken = token<IBootstrapEngine>(
  'engine/bootstrap/engine',
)
export const bootstrapBootSurfaceToken = token<IBootstrapBootSurface>(
  'engine/bootstrap/bootSurface',
)
export const bootstrapGameDefinitionToken = token<IBootstrapGameDefinition>(
  'engine/bootstrap/gameDefinition',
)
