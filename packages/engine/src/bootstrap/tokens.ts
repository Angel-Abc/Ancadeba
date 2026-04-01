import { token } from '@ancadeba/utils'
import {
  IBootstrapBootSurface,
  IBootstrapEngine,
  IBootstrapFinalizer,
  IBootstrapGameData,
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
export const bootstrapGameDataToken = token<IBootstrapGameData>(
  'engine/bootstrap/gameData',
)
export const bootstrapFinalizerToken = token<IBootstrapFinalizer>(
  'engine/bootstrap/finalizer',
)
