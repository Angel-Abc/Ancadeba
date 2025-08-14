import { describe, it, expect, vi, afterEach } from 'vitest'
import { z } from 'zod'
import { loadJsonResource } from '@utils/loadJsonResource'
import * as log from '@utils/logMessage'

const originalFetch = globalThis.fetch

afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
})

describe('loadJsonResource', () => {
    it('loads valid JSON successfully', async () => {
        const data = { id: 'abc' }
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(data)
        } as unknown as Response))
        const schema = z.object({ id: z.string() })
        await expect(loadJsonResource('/url', schema)).resolves.toEqual(data)
    })

    it('calls fatalError on network error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
        const schema = z.object({ id: z.string() })
        const fatalSpy = vi.spyOn(log, 'fatalError').mockImplementation(() => { throw new Error('fatal') })
        await expect(loadJsonResource('/url', schema)).rejects.toThrow('fatal')
        expect(fatalSpy).toHaveBeenCalled()
    })

    it('calls fatalError on non-ok response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as unknown as Response))
        const schema = z.object({ id: z.string() })
        const fatalSpy = vi.spyOn(log, 'fatalError').mockImplementation(() => { throw new Error('fatal') })
        await expect(loadJsonResource('/url', schema)).rejects.toThrow('fatal')
        expect(fatalSpy).toHaveBeenCalled()
    })

    it('calls fatalError on invalid JSON', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockRejectedValue(new Error('bad json'))
        } as unknown as Response))
        const schema = z.object({ id: z.string() })
        const fatalSpy = vi.spyOn(log, 'fatalError').mockImplementation(() => { throw new Error('fatal') })
        await expect(loadJsonResource('/url', schema)).rejects.toThrow('fatal')
        expect(fatalSpy).toHaveBeenCalled()
    })

    it('calls fatalError on schema validation failure', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ id: 123 })
        } as unknown as Response))
        const schema = z.object({ id: z.string() })
        const fatalSpy = vi.spyOn(log, 'fatalError').mockImplementation(() => { throw new Error('fatal') })
        await expect(loadJsonResource('/url', schema)).rejects.toThrow('fatal')
        expect(fatalSpy).toHaveBeenCalled()
    })
})

