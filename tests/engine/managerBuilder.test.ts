import { describe, it, expect } from 'vitest'
import { ManagersBuilder } from '@builders/managersBuilder'
import { actionManagerToken } from '@managers/actionManager'
import { domManagerToken } from '@managers/domManager'
import { languageManagerToken } from '@managers/languageManager'
import { mapManagerToken } from '@managers/mapManager'
import { pageManagerToken } from '@managers/pageManager'
import { tileSetManagerToken } from '@managers/tileSetManager'
import { playerPositionManagerToken } from '@managers/playerPositionManager'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'

describe('managersBuilder', () => {
  it('registers managers', () => {
    const builder = new ManagersBuilder()
    const container = new Container()
    builder.register(container)

    const registeredTokens = Array.from(
      (container as unknown as { providers: Map<Token<unknown>, unknown> }).providers.keys()
    )
    expect(new Set(registeredTokens)).toEqual(
      new Set([
        domManagerToken,
        languageManagerToken,
        pageManagerToken,
        actionManagerToken,
        tileSetManagerToken,
        playerPositionManagerToken,
        mapManagerToken,
      ])
    )
  })
})

