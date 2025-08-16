import { describe, it, expect, vi, afterEach } from 'vitest'
import { LogLevel } from '@utils/types'

afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.LOG_LEVEL
})

describe('logMessage color reset', () => {
    it('resets color for debug', async () => {
        vi.resetModules()
        process.env.LOG_LEVEL = 'debug'
        const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
        const { logMessage } = await import('@utils/logMessage')
        logMessage(LogLevel.debug, undefined, 'test')
        expect(debugSpy).toHaveBeenCalledWith('\x1B[37mtest\x1B[0m')
    })

    it('resets color for info', async () => {
        vi.resetModules()
        process.env.LOG_LEVEL = 'debug'
        const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
        const { logMessage } = await import('@utils/logMessage')
        logMessage(LogLevel.info, undefined, 'test')
        expect(infoSpy).toHaveBeenCalledWith('\x1B[30mtest\x1B[0m')
    })

    it('resets color for warning', async () => {
        vi.resetModules()
        process.env.LOG_LEVEL = 'debug'
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const { logMessage } = await import('@utils/logMessage')
        logMessage(LogLevel.warning, undefined, 'test')
        expect(warnSpy).toHaveBeenCalledWith('\x1B[1m\x1B[33mtest\x1B[0m')
    })

    it('resets color for error', async () => {
        vi.resetModules()
        process.env.LOG_LEVEL = 'debug'
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const { logMessage } = await import('@utils/logMessage')
        logMessage(LogLevel.error, undefined, 'test')
        expect(errorSpy).toHaveBeenCalledWith('\x1B[1m\x1B[31mtest\x1B[0m')
    })
})
