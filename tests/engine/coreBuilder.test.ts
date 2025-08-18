import { describe, it, expect, vi } from 'vitest'
import { CoreBuilder } from '@builders/containerBuilders/coreBuilder'
import { engineInitializerToken, actionHandlerRegistrarsToken, conditionResolverRegistrarsToken, inputsProviderRegistrarsToken } from '@core/engineInitializer'
import { gameEngineToken } from '@core/gameEngine'
import { turnSchedulerToken } from '@core/turnScheduler'
import { keyboardEventListenerToken } from '@utils/keyboardEventListener'
import { messageBusToken } from '@utils/messageBus'
import { messageQueueToken } from '@utils/messageQueue'
import { inputMatrixBuilderToken } from '@builders/inputMatrixBuilder'
import { pageInputsToken } from '@inputs/pageInputs'
import { dialogInputsToken } from '@inputs/dialogInputs'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'
import type { ILogger } from '@utils/logger'

describe('coreBuilder', () => {
  it('registers core services', () => {
    const builder = new CoreBuilder(() => () => {})
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
        messageBusToken,
        messageQueueToken,
        turnSchedulerToken,
        engineInitializerToken,
        keyboardEventListenerToken,
        inputMatrixBuilderToken,
        pageInputsToken,
        dialogInputsToken,
        actionHandlerRegistrarsToken,
        conditionResolverRegistrarsToken,
        inputsProviderRegistrarsToken,
      ])
    )
    expect(registeredTokens).toHaveLength(12)
  })
})

