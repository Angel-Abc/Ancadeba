import { describe, it, expect, vi } from 'vitest'
import { ServiceProvider } from '@providers/serviceProvider'
import { token, type Token } from '@ioc/token'
import type { Container } from '@ioc/types'

describe('ServiceProvider', () => {
  it('resolves services via the underlying container', () => {
    const KNOWN_TOKEN = token<{ value: number }>('known')
    const serviceInstance = { value: 42 }

    const mockContainer: Container = {
      resolve<T>(t: Token<T>): T {
        if (t === KNOWN_TOKEN) {
          return serviceInstance as unknown as T
        }
        throw new Error('Unknown token')
      }
    }
    const spy = vi.spyOn(mockContainer, 'resolve')

    const provider = new ServiceProvider(mockContainer)
    const resolved = provider.getService(KNOWN_TOKEN)

    expect(resolved).toBe(serviceInstance)
    expect(spy).toHaveBeenCalledWith(KNOWN_TOKEN)
  })

  it('propagates errors for unresolved tokens', () => {
    const KNOWN_TOKEN = token('known')
    const UNKNOWN_TOKEN = token('unknown')
    const serviceInstance = 'hello'

    const mockContainer: Container = {
      resolve<T>(t: Token<T>): T {
        if (t === KNOWN_TOKEN) {
          return serviceInstance as unknown as T
        }
        throw new Error('Unknown token')
      }
    }
    const spy = vi.spyOn(mockContainer, 'resolve')

    const provider = new ServiceProvider(mockContainer)

    expect(() => provider.getService(UNKNOWN_TOKEN)).toThrowError('Unknown token')
    expect(spy).toHaveBeenCalledWith(UNKNOWN_TOKEN)
  })
})
