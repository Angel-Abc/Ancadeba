import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/input', () => ({ mapVirtualKeys: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { mapVirtualKeys } from '@loader/mappers/input'
import { VirtualKeysLoader } from '@loader/virtualKeysLoader'

const dataPathProvider = { dataPath: '/base' }

describe('VirtualKeysLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads and maps virtual keys using dataPath', async () => {
    const schema1: unknown = [{ s: 1 }]
    const schema2: unknown = [{ s: 2 }]
    ;(loadJsonResource as unknown as Mock)
      .mockResolvedValueOnce(schema1)
      .mockResolvedValueOnce(schema2)
    ;(mapVirtualKeys as unknown as Mock)
      .mockReturnValueOnce([{ virtualKey: 'jump', keyCode: 'Space', alt: false, ctrl: false, shift: false }])
      .mockReturnValueOnce([{ virtualKey: 'run', keyCode: 'KeyR', alt: false, ctrl: false, shift: false }])

    const loader = new VirtualKeysLoader(dataPathProvider)
    const result = await loader.loadVirtualKeys(['k1.json', 'k2.json'])

    expect(loadJsonResource).toHaveBeenNthCalledWith(1, '/base/k1.json', expect.anything())
    expect(loadJsonResource).toHaveBeenNthCalledWith(2, '/base/k2.json', expect.anything())
    expect(mapVirtualKeys).toHaveBeenNthCalledWith(1, schema1)
    expect(mapVirtualKeys).toHaveBeenNthCalledWith(2, schema2)
    expect(result).toEqual([
      { virtualKey: 'jump', keyCode: 'Space', alt: false, ctrl: false, shift: false },
      { virtualKey: 'run', keyCode: 'KeyR', alt: false, ctrl: false, shift: false }
    ])
  })

  it('throws when no virtual keys paths provided', async () => {
    const loader = new VirtualKeysLoader(dataPathProvider)
    await expect(loader.loadVirtualKeys([])).rejects.toThrow('No virtual keys paths provided')
  })
})

