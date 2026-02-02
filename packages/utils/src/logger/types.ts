import { Token } from '../ioc/token'
import { ConsoleLogger } from './console'

export interface ILogger {
  debug(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string
  info(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string
  warn(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string
  error(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string
}

export function createInstance(): ILogger {
  return new ConsoleLogger()
}
