import { describe, expect, it, vi, afterEach } from 'vitest'
import { z } from 'zod'
import { loadJsonResource } from '../../json/loadJsonResource'
import { createLogger, createSpyLogger } from '../testUtils'

describe('json/loadJsonResource', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('loads and parses JSON with the provided schema', async () => {
    const logger = createLogger()
    const url = 'https://example.test/resource.json'
    const schema = z.object({ name: z.string() })

    const fetchMock = vi.fn(async () => ({
      json: async () => ({ name: 'Test Resource' }),
    }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    const result = await loadJsonResource(url, schema, logger)

    expect(result).toEqual({ name: 'Test Resource' })
    expect(fetchMock).toHaveBeenCalledWith(url)
  })

  it('logs and throws when the schema validation fails', async () => {
    const logger = createSpyLogger()
    const url = 'https://example.test/invalid.json'
    const schema = z.object({ name: z.string() })

    const fetchMock = vi.fn(async () => ({
      json: async () => ({ name: 123 }),
    }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await expect(loadJsonResource(url, schema, logger)).rejects.toThrow('fatal')

    expect(logger.fatal).toHaveBeenCalled()
  })

  it('logs and throws when the fetch fails', async () => {
    const logger = createSpyLogger()
    const url = 'https://example.test/failed.json'
    const schema = z.object({ name: z.string() })

    const fetchMock = vi.fn(async () => {
      throw new Error('network error')
    })
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await expect(loadJsonResource(url, schema, logger)).rejects.toThrow('fatal')

    expect(logger.fatal).toHaveBeenCalled()
  })

  it('logs and throws when parsing JSON fails', async () => {
    const logger = createSpyLogger()
    const url = 'https://example.test/parse-error.json'
    const schema = z.object({ name: z.string() })

    const fetchMock = vi.fn(async () => ({
      json: async () => {
        throw new Error('invalid json')
      },
    }))
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch)

    await expect(loadJsonResource(url, schema, logger)).rejects.toThrow('fatal')

    expect(logger.fatal).toHaveBeenCalled()
  })
})
