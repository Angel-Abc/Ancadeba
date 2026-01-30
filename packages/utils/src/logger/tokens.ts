import { token } from '../ioc/token'
import { type ILogger, LoggerLogName } from './types'

export const loggerToken = token<ILogger>(LoggerLogName)
