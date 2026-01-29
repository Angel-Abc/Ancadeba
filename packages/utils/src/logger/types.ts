import { token } from '../ioc/token'
import { ConsoleLogger } from './console'

const logName = '/utils/logger/types'

export interface ILogger {
  debug(category: string, message: string, ...args: unknown[]): string
  info(category: string, message: string, ...args: unknown[]): string
  warn(category: string, message: string, ...args: unknown[]): string
  error(category: string, message: string, ...args: unknown[]): string
}
export const loggerToken = token<ILogger>(logName)

export function createInstance(): ILogger {
  return new ConsoleLogger()
}
