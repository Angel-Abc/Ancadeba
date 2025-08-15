import { describe, it, expect } from 'vitest'
import { Container } from '@ioc/container'
import { dataPathProviderToken, type IDataPathProvider } from '@providers/configProviders'

describe('configProviders', () => {
  it('provides dataPath via the DI container', () => {
    const container = new Container()
    const provider: IDataPathProvider = { dataPath: '/test/data' }
    container.register({ token: dataPathProviderToken, useValue: provider })

    const resolved = container.resolve(dataPathProviderToken)
    expect(resolved.dataPath).toBe('/test/data')
  })

  it('throws when dataPathProvider is not registered', () => {
    const container = new Container()
    expect(() => container.resolve(dataPathProviderToken))
      .toThrowError('[Container] No provider for DataPathProvider')
  })
})

