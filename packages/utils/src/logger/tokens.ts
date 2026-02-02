import { token } from '../ioc/token'
import { type ILogger } from './types'

export const loggerToken = token<ILogger>('utils/logger/logger')
