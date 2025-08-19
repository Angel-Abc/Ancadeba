import { token } from '@ioc/token'
import { LogLevel } from './types'
import { logMessage } from './logMessage'

/**
 * Logging abstraction used throughout the application.
 *
 * The {@link ILogger} interface defines level specific logging methods. A
 * {@link loggerToken} is exported so that implementations can be resolved via
 * dependency injection. The default {@link ConsoleLogger} delegates to
 * {@link logMessage}, which formats messages with `{0}` style placeholders and
 * colorizes console output based on the {@link LogLevel}.
 */
export interface ILogger {
    /**
     * Logs a debug message for the given category. Debug output is typically
     * colorized in gray and may be filtered by category.
     *
     * @param category - Category label used to filter debug messages.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message, even if debug output is disabled.
     */
    debug(category: string, message: string, ...args: unknown[]): string

    /**
     * Logs an informational message.
     *
     * @param category - Category label used to prefix the log line.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message, whether or not it was emitted.
     */
    info(category: string, message: string, ...args: unknown[]): string

    /**
     * Logs a warning message. Warning output is highlighted in bold yellow.
     *
     * @param category - Category label used to prefix the log line.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message, regardless of emission.
     */
    warn(category: string, message: string, ...args: unknown[]): string

    /**
     * Logs an error message. Error output is highlighted in bold red.
     *
     * @param category - Category label used to prefix the log line.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message, regardless of emission.
     */
    error(category: string, message: string, ...args: unknown[]): string
}

/**
 * Dependency injection token for resolving an {@link ILogger} implementation.
 */
export const loggerToken = token<ILogger>('Logger')

/** Default console backed {@link ILogger} implementation. */
export class ConsoleLogger implements ILogger {
    /**
     * Logs a debug level message to the console in gray.
     *
     * @param category - Category label used to filter debug messages.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message.
     */
    debug(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.debug, category, message, ...args)
    }

    /**
     * Logs an informational message to the console.
     *
     * @param category - Category label used to prefix the log line.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message.
     */
    info(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.info, category, message, ...args)
    }

    /**
     * Logs a warning message to the console in bold yellow.
     *
     * @param category - Category label used to prefix the log line.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message.
     */
    warn(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.warning, category, message, ...args)
    }

    /**
     * Logs an error message to the console in bold red.
     *
     * @param category - Category label used to prefix the log line.
     * @param message - Message template supporting `{0}` placeholders.
     * @param args - Values that replace placeholders in the message.
     * @returns The formatted message.
     */
    error(category: string, message: string, ...args: unknown[]): string {
        return logMessage(LogLevel.error, category, message, ...args)
    }
}
