import { describe, it, expect } from 'vitest'
import { LoadersBuilder } from '@builders/loadersBuilder'
import { actionHandlersLoaderToken } from '@loader/actionHandlersLoader'
import { gameLoaderToken } from '@loader/gameLoader'
import { gameMapLoaderToken } from '@loader/gameMapLoader'
import { languageLoaderToken } from '@loader/languageLoader'
import { pageLoaderToken } from '@loader/pageLoader'
import { tileSetLoaderToken } from '@loader/tileSetLoader'
import { virtualInputsLoaderToken } from '@loader/virtualInputsLoader'
import { virtualKeysLoaderToken } from '@loader/virtualKeysLoader'
import { Container } from '@ioc/container'
import type { Token } from '@ioc/token'

describe('loadersBuilder', () => {
  it('registers loaders', () => {
    const builder = new LoadersBuilder()
    const container = new Container()
    builder.register(container)

    const registeredTokens = Array.from(
      (container as unknown as { providers: Map<Token<unknown>, unknown> }).providers.keys()
    )
    expect(new Set(registeredTokens)).toEqual(
      new Set([
        gameLoaderToken,
        languageLoaderToken,
        pageLoaderToken,
        actionHandlersLoaderToken,
        gameMapLoaderToken,
        tileSetLoaderToken,
        virtualKeysLoaderToken,
        virtualInputsLoaderToken,
      ])
    )
  })
})

