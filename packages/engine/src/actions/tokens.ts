import { token } from '@ancadeba/utils'
import type { IGameActionEnvironment, IGameActionExecutor } from './types'

export const gameActionExecutorToken = token<IGameActionExecutor>(
  'engine/actions/gameActionExecutor',
)

export const gameActionEnvironmentToken = token<IGameActionEnvironment>(
  'engine/actions/gameActionEnvironment',
)
