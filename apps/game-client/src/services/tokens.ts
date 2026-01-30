import { token } from '@ancadeba/utils'
import { type IBootService, BootServiceLogName } from './types'

export const bootServiceToken = token<IBootService>(BootServiceLogName)
