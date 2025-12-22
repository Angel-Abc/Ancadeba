import { describe, expect, it } from 'vitest'
import { describeToken, token } from '../../ioc/token'

describe('ioc/token', () => {
  it('returns token descriptions when provided', () => {
    const value = token('test/description')

    expect(describeToken(value)).toBe('test/description')
  })

  it('falls back to anonymous-token when missing a description', () => {
    const value = token()

    expect(describeToken(value)).toBe('anonymous-token')
  })
})
