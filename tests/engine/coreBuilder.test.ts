import { describe, it, expect, vi } from 'vitest'
import { CoreBuilder } from '@builders/containerBuilders/coreBuilder'
import { gameEngineToken } from '@core/gameEngine'
import { turnSchedulerToken } from '@core/turnScheduler'
import { inputMatrixBuilderToken } from '@builders/inputMatrixBuilder'
import { engineInitializerToken } from '@core/initializers/engineInitializer'
import { coreInitializerToken } from '@core/initializers/coreInitializer'
import { engineStartInitializerToken } from '@core/initializers/engineStartInitializer'
import { providersInitializerToken } from '@core/initializers/providersInitializer'
import { managersInitializerToken } from '@core/initializers/managersInitializer'
import { registriesInitializerToken } from '@core/initializers/registriesInitializers'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'
import type { ILogger } from '@utils/logger'

describe('coreBuilder', () => {
  it('registers core services', () => {
    const builder = new CoreBuilder()
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn((category: string, message: string, ...args: unknown[]) =>
        `[${category}] ${message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))}`),
    }
    const container = new Container(logger)
    builder.register(container)

    const registeredTokens = Array.from(
      (container as unknown as { providers: Map<Token<unknown>, unknown> }).providers.keys()
    )
    expect(registeredTokens).toEqual(
      expect.arrayContaining([
        gameEngineToken,
        turnSchedulerToken,
        inputMatrixBuilderToken,
        engineInitializerToken,
        coreInitializerToken,
        engineStartInitializerToken,
        providersInitializerToken,
        managersInitializerToken,
        registriesInitializerToken,
      ])
    )
    expect(registeredTokens).toHaveLength(9)
  })
})
