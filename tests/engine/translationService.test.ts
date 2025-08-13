import { describe, it, expect, vi } from 'vitest'
import { TranslationService } from '../../engine/services/translationService'
import type { Language } from '@loader/data/language'
import * as log from '../../utils/logMessage'

describe('TranslationService', () => {
  it('returns key when translation is missing and logs a warning', () => {
    const warningSpy = vi.spyOn(log, 'logWarning')
    const service = new TranslationService()
    const mockLanguage: Language = { id: 'en', translations: { existing: 'Hello' } }
    service.setLanguage(mockLanguage)
    expect(service.translate('missing')).toBe('missing')
    expect(warningSpy).toHaveBeenCalledTimes(1)
    warningSpy.mockRestore()
  })

  it('throws if language was not set', () => {
    const service = new TranslationService()
    expect(() => service.translate('any')).toThrow('[TranslationService] Language not set for translation')
  })
})

