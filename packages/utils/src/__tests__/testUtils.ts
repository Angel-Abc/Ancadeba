import { vi } from 'vitest'
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

export const createSpyLogger = (): ILogger => ({
  debug: vi.fn(() => ''),
  info: vi.fn(() => ''),
  warn: vi.fn(() => ''),
  error: vi.fn(() => ''),
  fatal: vi.fn(() => {
    throw new Error('fatal')
  }),
})
