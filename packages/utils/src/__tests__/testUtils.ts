import type { ILogger } from '../index'

export const createLogger = (): ILogger => ({
  debug: () => '',
  info: () => '',
  warn: () => '',
  error: () => '',
  fatal: () => {
    throw new Error('fatal')
  },
})
