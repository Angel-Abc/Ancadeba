import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/game', () => ({ mapGame: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { mapGame } from '@loader/mappers/game'
import { GameLoader } from '@loader/gameLoader'

const basePathProvider = { dataPath: '/base' }

describe('GameLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads game using dataPath and maps it', async () => {
    const schema: unknown = { raw: true }
    ;(loadJsonResource as unknown as Mock).mockResolvedValue(schema)
    const mapped = { mapped: true }
    ;(mapGame as unknown as Mock).mockReturnValue(mapped)

    const loader = new GameLoader(basePathProvider)
    const result = await loader.loadGame()

    expect(loadJsonResource).toHaveBeenCalledWith('/base/index.json', expect.anything())
    expect(mapGame).toHaveBeenCalledWith(schema, '/base')
    expect(result).toBe(mapped)
  })
})
