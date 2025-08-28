import { describe, it, expect, vi, afterEach } from 'vitest'
import { z } from 'zod'
import { saveJsonResource } from '@utils/saveJsonResource'
import * as log from '@utils/logMessage'
import type { ILogger } from '@utils/logger'

const originalFetch = globalThis.fetch

afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
})

describe('saveJsonResource', () => {
    it('saves valid JSON successfully', async () => {
        const data = { id: 'abc' }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true } as unknown as Response))
        const schema = z.object({ id: z.string() })
        const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        await expect(saveJsonResource('/url', data, schema, logger)).resolves.toBeUndefined()
        expect(fetch).toHaveBeenCalledWith('/url', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
    })

    it('calls fatalError on network error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
        const schema = z.object({ id: z.string() })
        const fatalSpy = vi.spyOn(log, 'fatalError').mockImplementation(() => { throw new Error('fatal') })
        const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        await expect(saveJsonResource('/url', { id: 'abc' }, schema, logger)).rejects.toThrow('fatal')
        expect(fatalSpy).toHaveBeenCalled()
    })

    it('calls fatalError on non-ok response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as unknown as Response))
        const schema = z.object({ id: z.string() })
        const fatalSpy = vi.spyOn(log, 'fatalError').mockImplementation(() => { throw new Error('fatal') })
        const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        await expect(saveJsonResource('/url', { id: 'abc' }, schema, logger)).rejects.toThrow('fatal')
        expect(fatalSpy).toHaveBeenCalled()
    })

    it('calls fatalError on schema validation failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true } as unknown as Response))
        const schema = z.object({ id: z.string() })
        const fatalSpy = vi.spyOn(log, 'fatalError').mockImplementation(() => { throw new Error('fatal') })
        const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        await expect(saveJsonResource('/url', { id: 123 }, schema, logger)).rejects.toThrow('fatal')
        expect(fatalSpy).toHaveBeenCalled()
        expect(fetch).not.toHaveBeenCalled()
    })
})

