import { describe, it, expect, vi } from 'vitest'
import { CoreBuilder } from '@builders/coreBuilder'
import { engineInitializerToken } from '@engine/engineInitializer'
import { gameEngineToken } from '@engine/gameEngine'
import { turnSchedulerToken } from '@engine/turnScheduler'
import { keyboardEventListenerToken } from '@utils/keyboardEventListener'
import { messageBusToken } from '@utils/messageBus'
import { messageQueueToken } from '@utils/messageQueue'
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
    expect(new Set(registeredTokens)).toEqual(
      new Set([
        gameEngineToken,
        messageBusToken,
        messageQueueToken,
        turnSchedulerToken,
        engineInitializerToken,
        keyboardEventListenerToken,
      ])
    )
  })
})

