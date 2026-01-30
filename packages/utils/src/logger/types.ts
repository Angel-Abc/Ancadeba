import { ConsoleLogger } from './console'

export const LoggerLogName = '/utils/logger/types'

export interface ILogger {
  debug(category: string, message: string, ...args: unknown[]): string
  info(category: string, message: string, ...args: unknown[]): string
  warn(category: string, message: string, ...args: unknown[]): string
  error(category: string, message: string, ...args: unknown[]): string
}

export function createInstance(): ILogger {
  return new ConsoleLogger()
}
