import { token } from '@ioc/token'
import { LogLevel } from './types'
import { logMessage } from './logMessage'

export interface ILogger {
    debug(category: string, message: string, ...args: unknown[]): string
    info(category: string, message: string, ...args: unknown[]): string
    warn(category: string, message: string, ...args: unknown[]): string
    error(category: string, message: string, ...args: unknown[]): string
}

export const loggerToken = token<ILogger>('Logger')

export class ConsoleLogger implements ILogger {
    debug(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.debug, category, message, ...args)
    }
    info(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.info, category, message, ...args)
    }
    warn(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.warning, category, message, ...args)
    }
    error(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.error, category, message, ...args)
    }
}
