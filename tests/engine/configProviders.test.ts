import { describe, it, expect, vi } from 'vitest'
import { Container } from '@ioc/container'
import { dataPathProviderToken, type IDataPathProvider } from '@providers/configProviders'
import type { ILogger } from '@utils/logger'

describe('configProviders', () => {
  it('provides dataPath via the DI container', () => {
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn((category: string, message: string, ...args: unknown[]) =>
        `[${category}] ${message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))}`),
    }
    const container = new Container(logger)
    const provider: IDataPathProvider = { dataPath: '/test/data' }
    container.register({ token: dataPathProviderToken, useValue: provider })

    const resolved = container.resolve(dataPathProviderToken)
    expect(resolved.dataPath).toBe('/test/data')
  })

  it('throws when dataPathProvider is not registered', () => {
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn((category: string, message: string, ...args: unknown[]) =>
        `[${category}] ${message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))}`),
    }
    const container = new Container(logger)
    expect(() => container.resolve(dataPathProviderToken))
      .toThrowError('[Container] No provider for DataPathProvider')
  })
})

