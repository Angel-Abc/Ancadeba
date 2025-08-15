import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/input', () => ({ mapVirtualInputs: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { mapVirtualInputs } from '@loader/mappers/input'
import { VirtualInputsLoader } from '@loader/virtualInputsLoader'

const dataPathProvider = { dataPath: '/base' }

describe('VirtualInputsLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads and maps virtual inputs using dataPath', async () => {
    const schema1: unknown = [{ s: 1 }]
    const schema2: unknown = [{ s: 2 }]
    ;(loadJsonResource as unknown as Mock)
      .mockResolvedValueOnce(schema1)
      .mockResolvedValueOnce(schema2)
    ;(mapVirtualInputs as unknown as Mock)
      .mockReturnValueOnce([{ virtualInput: 'jump', virtualKeys: ['VK_JUMP'], label: 'Jump' }])
      .mockReturnValueOnce([{ virtualInput: 'run', virtualKeys: ['VK_RUN'], label: 'Run' }])

    const loader = new VirtualInputsLoader(dataPathProvider)
    const result = await loader.loadVirtualInputs(['v1.json', 'v2.json'])

    expect(loadJsonResource).toHaveBeenNthCalledWith(1, '/base/v1.json', expect.anything())
    expect(loadJsonResource).toHaveBeenNthCalledWith(2, '/base/v2.json', expect.anything())
    expect(mapVirtualInputs).toHaveBeenNthCalledWith(1, schema1)
    expect(mapVirtualInputs).toHaveBeenNthCalledWith(2, schema2)
    expect(result).toEqual([
      { virtualInput: 'jump', virtualKeys: ['VK_JUMP'], label: 'Jump' },
      { virtualInput: 'run', virtualKeys: ['VK_RUN'], label: 'Run' }
    ])
  })

  it('throws when no virtual inputs paths provided', async () => {
    const loader = new VirtualInputsLoader(dataPathProvider)
    await expect(loader.loadVirtualInputs([])).rejects.toThrow('No virtual inputs paths provided')
  })
})

