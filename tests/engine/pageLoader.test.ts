import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/page', () => ({ mapPage: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { mapPage } from '@loader/mappers/page'
import { PageLoader } from '@loader/pageLoader'

const basePathProvider = { dataPath: '/base' }

describe('PageLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads page using dataPath and maps it', async () => {
    const schema: unknown = { id: 'page' }
    ;(loadJsonResource as unknown as Mock).mockResolvedValue(schema)
    const mapped = { id: 'page', content: [] }
    ;(mapPage as unknown as Mock).mockReturnValue(mapped)

    const loader = new PageLoader(basePathProvider)
    const result = await loader.loadPage('pages/start.json')

    expect(loadJsonResource).toHaveBeenCalledWith('/base/pages/start.json', expect.anything())
    expect(mapPage).toHaveBeenCalledWith('/base', schema)
    expect(result).toBe(mapped)
  })
})
