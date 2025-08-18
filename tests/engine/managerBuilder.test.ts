import { describe, it, expect, vi } from 'vitest'
import { ManagersBuilder } from '@builders/containerBuilders/managersBuilder'
import { actionManagerToken } from '@managers/actionManager'
import { domManagerToken } from '@managers/domManager'
import { languageManagerToken } from '@managers/languageManager'
import { mapManagerToken } from '@managers/mapManager'
import { pageManagerToken } from '@managers/pageManager'
import { tileSetManagerToken } from '@managers/tileSetManager'
import { playerPositionManagerToken } from '@managers/playerPositionManager'
import { tileTriggerManagerToken } from '@managers/tileTriggerManager'
import { turnManagerToken } from '@managers/turnManager'
import { inputManagerToken } from '@managers/inputManager'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'
import type { ILogger } from '@utils/logger'

describe('managersBuilder', () => {
  it('registers managers', () => {
    const builder = new ManagersBuilder()
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
    const container = new Container(logger)
    builder.register(container)

    const registeredTokens = Array.from(
      (container as unknown as { providers: Map<Token<unknown>, unknown> }).providers.keys()
    ).map(String)
    expect(new Set(registeredTokens)).toEqual(
      new Set([
        domManagerToken,
        languageManagerToken,
        pageManagerToken,
        actionManagerToken,
        tileSetManagerToken,
        playerPositionManagerToken,
        tileTriggerManagerToken,
        mapManagerToken,
        turnManagerToken,
        inputManagerToken,
      ].map(String))
    )
  })
})

