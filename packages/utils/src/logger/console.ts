import { Token } from '../ioc/token'
import { isCategoryEnabled, isLevelEnabled } from './helpers'
import { LogLevel } from './logLevel'
import { type ILogger } from './types'

function formatMessageForConsole(
  message: string,
  ...args: unknown[]
): { formattedMessage: string; extraArgs: unknown[] } {
  const extraArgs: unknown[] = []

  const formattedMessage = message.replace(
    /\{(\d+)\}/g,
    (_: string, indexStr: string) => {
      const index = parseInt(indexStr, 10)
      const arg: unknown = args[index]

      if (typeof arg === 'object' && arg !== null) {
        extraArgs.push(arg)
        return '%o'
      }

      return String(arg)
    },
  )

  return { formattedMessage, extraArgs }
}

function getCategoryString(
  category: string | undefined | Token<unknown>,
): string | undefined {
  if (category === undefined) {
    return undefined
  }
  if (typeof category === 'string') {
    return category
  }
  return category.description
}

function logMessage(
  logLevel: LogLevel,
  category: string | undefined | Token<unknown>,
  message: string,
  ...args: unknown[]
): string {
  const { formattedMessage, extraArgs } = formatMessageForConsole(
    message,
    ...args,
  )
  if (!isLevelEnabled(logLevel)) return formattedMessage
  const categoryStr = getCategoryString(category)
  if (logLevel === LogLevel.debug && !isCategoryEnabled(categoryStr))
    return formattedMessage

  const finalMessage = category
    ? `[${categoryStr}] ${formattedMessage}`
    : formattedMessage

  switch (logLevel) {
    case LogLevel.debug:
      console.debug('\x1B[37m' + finalMessage + '\x1B[0m', ...extraArgs)
      break
    case LogLevel.info:
      console.info('\x1B[36m' + finalMessage + '\x1B[0m', ...extraArgs)
      break
    case LogLevel.warning:
      console.warn('\x1B[1m\x1B[33m' + finalMessage + '\x1B[0m', ...extraArgs)
      break
    case LogLevel.error:
      console.error('\x1B[1m\x1B[31m' + finalMessage + '\x1B[0m', ...extraArgs)
      break
    default:
      console.log(finalMessage, ...extraArgs)
      break
  }

  return finalMessage
}

export class ConsoleLogger implements ILogger {
  debug(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string {
    return logMessage(LogLevel.debug, category, message, ...args)
  }
  info(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string {
    return logMessage(LogLevel.info, category, message, ...args)
  }
  warn(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string {
    return logMessage(LogLevel.warning, category, message, ...args)
  }
  error(
    category: string | Token<unknown>,
    message: string,
    ...args: unknown[]
  ): string {
    return logMessage(LogLevel.error, category, message, ...args)
  }
}
