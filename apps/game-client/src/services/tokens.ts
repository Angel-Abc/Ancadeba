import { token } from '@ancadeba/utils'
import {
  type IBootService,
  type IBootProgressTracker,
  BootServiceLogName,
  BootProgressTrackerLogName,
  type IWorldService,
  WorldServiceLogName,
} from './types'

export const bootProgressTrackerToken =
  token<IBootProgressTracker>(BootProgressTrackerLogName)
export const bootServiceToken = token<IBootService>(BootServiceLogName)
export const worldServiceToken = token<IWorldService>(WorldServiceLogName)
