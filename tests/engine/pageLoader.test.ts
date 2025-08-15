import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/logMessage', () => ({
  fatalError: vi.fn((categoryOrMessage: string, message?: string) => {
    throw new Error(message ?? categoryOrMessage)
  })
}))
vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/page', () => ({ mapPage: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { fatalError } from '@utils/logMessage'
import { mapPage } from '@loader/mappers/page'
import { PageLoader } from '@loader/pageLoader'

const dataPathProvider = { dataPath: '/base' }

describe('PageLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads page using dataPath and maps it', async () => {
    const schema: unknown = { id: 'page' }
    ;(loadJsonResource as unknown as Mock).mockResolvedValue(schema)
    const mapped = { id: 'page', content: [] }
    ;(mapPage as unknown as Mock).mockReturnValue(mapped)

    const loader = new PageLoader(dataPathProvider)
    const result = await loader.loadPage('pages/start.json')

    expect(loadJsonResource).toHaveBeenCalledWith('/base/pages/start.json', expect.anything())
    expect(mapPage).toHaveBeenCalledWith('/base', schema)
    expect(result).toBe(mapped)
  })

  it('throws when loadJsonResource rejects', async () => {
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(loadJsonResource as unknown as Mock).mockImplementation(() => fatalError('fail'))

    const loader = new PageLoader(dataPathProvider)
    await expect(loader.loadPage('pages/start.json')).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
    expect(mapPage).not.toHaveBeenCalled()
  })

  it('throws when loadJsonResource returns invalid data', async () => {
    ;(loadJsonResource as unknown as Mock).mockResolvedValue({})
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(mapPage as unknown as Mock).mockImplementation(() => fatalError('invalid'))

    const loader = new PageLoader(dataPathProvider)
    await expect(loader.loadPage('pages/start.json')).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
  })
})
