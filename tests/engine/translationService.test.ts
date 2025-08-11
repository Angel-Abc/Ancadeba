import { describe, it, expect } from 'vitest'
import { TranslationService } from '../../engine/services/translationService'
import type { Language } from '@loader/data/language'

describe('TranslationService', () => {
  it('returns key when translation is missing', () => {
    const service = new TranslationService()
    const mockLanguage: Language = { id: 'en', translations: { existing: 'Hello' } }
    service.setLanguage(mockLanguage)
    expect(service.translate('missing')).toBe('missing')
  })

  it('throws if language was not set', () => {
    const service = new TranslationService()
    expect(() => service.translate('any')).toThrow('[TranslationService] Language not set for translation')
  })
})

