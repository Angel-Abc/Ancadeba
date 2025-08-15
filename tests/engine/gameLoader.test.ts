import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/logMessage', () => ({
  fatalError: vi.fn((categoryOrMessage: string, message?: string) => {
    throw new Error(message ?? categoryOrMessage)
  })
}))
vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/game', () => ({ mapGame: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { fatalError } from '@utils/logMessage'
import { mapGame } from '@loader/mappers/game'
import { GameLoader } from '@loader/gameLoader'

const dataPathProvider = { dataPath: '/base' }

describe('GameLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads game using dataPath and maps it', async () => {
    const schema: unknown = { raw: true }
    ;(loadJsonResource as unknown as Mock).mockResolvedValue(schema)
    const mapped = { mapped: true }
    ;(mapGame as unknown as Mock).mockReturnValue(mapped)

    const loader = new GameLoader(dataPathProvider)
    const result = await loader.loadGame()

    expect(loadJsonResource).toHaveBeenCalledWith('/base/index.json', expect.anything())
    expect(mapGame).toHaveBeenCalledWith(schema, '/base')
    expect(result).toBe(mapped)
  })

  it('throws when loadJsonResource rejects', async () => {
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(loadJsonResource as unknown as Mock).mockImplementation(() => fatalError('fail'))

    const loader = new GameLoader(dataPathProvider)
    await expect(loader.loadGame()).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
    expect(mapGame).not.toHaveBeenCalled()
  })

  it('throws when loadJsonResource returns invalid data', async () => {
    ;(loadJsonResource as unknown as Mock).mockResolvedValue({})
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(mapGame as unknown as Mock).mockImplementation(() => fatalError('invalid'))

    const loader = new GameLoader(dataPathProvider)
    await expect(loader.loadGame()).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
  })
})
