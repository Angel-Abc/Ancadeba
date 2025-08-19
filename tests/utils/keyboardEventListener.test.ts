import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { KeyboardEventListener } from '@utils/keyboardEventListener'

describe('KeyboardEventListener', () => {
    let listener: KeyboardEventListener
    let handler: ((event: globalThis.KeyboardEvent) => void) | undefined
    const documentStub = {
        addEventListener: vi.fn<(type: string, cb: (e: globalThis.KeyboardEvent) => void) => void>((_, cb) => {
            handler = cb
        }),
        removeEventListener: vi.fn<(type: string, cb: (e: globalThis.KeyboardEvent) => void) => void>()
    }

    beforeEach(() => {
        handler = undefined
        vi.stubGlobal('document', documentStub)
        listener = new KeyboardEventListener()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('addListener triggers callbacks with normalized key data', () => {
        const callback = vi.fn()
        listener.addListener(callback)

        const event = {
            code: 'KeyA',
            altKey: true,
            ctrlKey: false,
            shiftKey: true
        } as unknown as globalThis.KeyboardEvent

        handler!(event)

        expect(callback).toHaveBeenCalledWith({
            code: 'KeyA',
            alt: true,
            ctrl: false,
            shift: true
        })
    })

    it('cleanup removes DOM listeners and registered callbacks', () => {
        const callback = vi.fn()
        listener.addListener(callback)
        const boundHandler = handler!

        listener.cleanup()

        expect(documentStub.removeEventListener).toHaveBeenCalledWith('keydown', boundHandler)

        boundHandler({
            code: 'KeyB',
            altKey: false,
            ctrlKey: false,
            shiftKey: false
        } as unknown as globalThis.KeyboardEvent)

        expect(callback).not.toHaveBeenCalled()
    })
})

