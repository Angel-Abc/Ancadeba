import { token } from '@ancadeba/utils'
import {
  type IBootService,
  BootServiceLogName,
  type IWorldService,
  WorldServiceLogName,
} from './types'

export const bootServiceToken = token<IBootService>(BootServiceLogName)
export const worldServiceToken = token<IWorldService>(WorldServiceLogName)
