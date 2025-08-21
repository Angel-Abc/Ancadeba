import { describe, it, expect, afterEach } from 'vitest'
import type { AddressInfo } from 'net'
import { createServer } from '../../packages/editor/server'

const request = async (origin?: string) => {
  const app = createServer()
  const server = app.listen(0)
  const { port } = server.address() as AddressInfo
  const res = await fetch(`http://localhost:${port}/data/whatever`, {
    headers: origin ? { Origin: origin } : {}
  })
  server.close()
  return res
}

describe('editor server CORS', () => {
  afterEach(() => {
    delete process.env.VITE_EDITOR_ORIGIN
  })

  it('uses default origin when not configured', async () => {
    const res = await request('http://localhost:5174')
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5174')
  })

  it('applies configured origin', async () => {
    process.env.VITE_EDITOR_ORIGIN = 'https://example.com'
    const res = await request('https://example.com')
    expect(res.headers.get('access-control-allow-origin')).toBe('https://example.com')
  })
})
