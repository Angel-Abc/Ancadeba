import { describe, it, expect, vi } from 'vitest'
import { TranslationService } from '../../engine/services/translationService'
import type { Language } from '@loader/data/language'
import type { ILogger } from '@utils/logger'

describe('TranslationService', () => {
  it('returns key when translation is missing and logs a warning', () => {
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const service = new TranslationService(logger)
    const mockLanguage: Language = { id: 'en', translations: { existing: 'Hello' } }
    service.setLanguage(mockLanguage)
    expect(service.translate('missing')).toBe('missing')
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('throws if language was not set', () => {
    const service = new TranslationService({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })
    expect(() => service.translate('any')).toThrow('[TranslationService] Language not set for translation')
  })
})

