import { describe, it, expect } from 'vitest'
import { CoreBuilder } from '@builders/coreBuilder'
import { engineInitializerToken } from '@engine/engineInitializer'
import { gameEngineToken } from '@engine/gameEngine'
import { turnSchedulerToken } from '@engine/turnScheduler'
import { keyboardeventListenerToken } from '@utils/keyboardEventListener'
import { messageBusToken } from '@utils/messageBus'
import { messageQueueToken } from '@utils/messageQueue'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'

describe('coreBuilder', () => {
  it('registers core services', () => {
    const builder = new CoreBuilder(() => () => {})
    const container = new Container()
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
        keyboardeventListenerToken,
      ])
    )
  })
})

