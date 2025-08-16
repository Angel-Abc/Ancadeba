import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/logMessage', () => ({
  fatalError: vi.fn((categoryOrMessage: string, message?: string) => {
    throw new Error(message ?? categoryOrMessage)
  })
}))
vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/language', () => ({ mapLanguage: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { fatalError } from '@utils/logMessage'
import { mapLanguage } from '@loader/mappers/language'
import { LanguageLoader } from '@loader/languageLoader'
import type { ILogger } from '@utils/logger'

const dataPathProvider = { dataPath: '/base' }

describe('LanguageLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads and merges languages using dataPath', async () => {
    const schema1: unknown = { s: 1 }
    const schema2: unknown = { s: 2 }
    ;(loadJsonResource as unknown as Mock)
      .mockResolvedValueOnce(schema1)
      .mockResolvedValueOnce(schema2)
    ;(mapLanguage as unknown as Mock)
      .mockReturnValueOnce({ id: 'en', translations: { a: '1' } })
      .mockReturnValueOnce({ id: 'en', translations: { b: '2' } })

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new LanguageLoader(dataPathProvider, logger)
    const result = await loader.loadLanguage(['lang/en.json', 'lang/en-extra.json'])

    expect(loadJsonResource).toHaveBeenNthCalledWith(1, '/base/lang/en.json', expect.anything(), logger)
    expect(loadJsonResource).toHaveBeenNthCalledWith(2, '/base/lang/en-extra.json', expect.anything(), logger)
    const mock = mapLanguage as unknown as Mock
    expect(mock.mock.calls[0][0]).toBe(schema1)
    expect(mock.mock.calls[1][0]).toBe(schema2)
    expect(result).toEqual({ id: 'en', translations: { a: '1', b: '2' } })
  })

  it('throws when no language paths provided', async () => {
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new LanguageLoader(dataPathProvider, logger)
    await expect(loader.loadLanguage([])).rejects.toThrow('No language paths provided')
  })

  it('throws on mismatched language ids', async () => {
    const schema1: unknown = { s: 1 }
    const schema2: unknown = { s: 2 }
    ;(loadJsonResource as unknown as Mock)
      .mockResolvedValueOnce(schema1)
      .mockResolvedValueOnce(schema2)
    ;(mapLanguage as unknown as Mock)
      .mockReturnValueOnce({ id: 'en', translations: {} })
      .mockReturnValueOnce({ id: 'fr', translations: {} })

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new LanguageLoader(dataPathProvider, logger)
    await expect(loader.loadLanguage(['a.json', 'b.json'])).rejects.toThrow(/Language ID mismatch/)
  })

  it('throws when loadJsonResource rejects', async () => {
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(loadJsonResource as unknown as Mock).mockImplementation(() => fatalError('fail'))

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new LanguageLoader(dataPathProvider, logger)
    await expect(loader.loadLanguage(['a.json'])).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
    expect(mapLanguage).not.toHaveBeenCalled()
  })

  it('throws when loadJsonResource returns invalid data', async () => {
    ;(loadJsonResource as unknown as Mock).mockResolvedValue({})
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(mapLanguage as unknown as Mock).mockImplementation(() => fatalError('invalid'))

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new LanguageLoader(dataPathProvider, logger)
    await expect(loader.loadLanguage(['a.json'])).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
  })
})
