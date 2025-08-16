import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'

vi.mock('@utils/logMessage', () => ({
  fatalError: vi.fn((categoryOrMessage: string, message?: string) => {
    throw new Error(message ?? categoryOrMessage)
  })
}))
vi.mock('@utils/loadJsonResource', () => ({ loadJsonResource: vi.fn() }))
vi.mock('@loader/mappers/handler', () => ({ mapHandlers: vi.fn() }))

import { loadJsonResource } from '@utils/loadJsonResource'
import { fatalError } from '@utils/logMessage'
import { mapHandlers } from '@loader/mappers/handler'
import { ActionHandlersLoader } from '@loader/actionHandlersLoader'
import type { ILogger } from '@utils/logger'

const dataPathProvider = { dataPath: '/base' }

describe('ActionHandlersLoader', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('loads and maps action handlers using dataPath', async () => {
    const schema1: unknown = [{ s: 1 }]
    const schema2: unknown = [{ s: 2 }]
    ;(loadJsonResource as unknown as Mock)
      .mockResolvedValueOnce(schema1)
      .mockResolvedValueOnce(schema2)
    ;(mapHandlers as unknown as Mock)
      .mockReturnValueOnce([{ id: 1 }])
      .mockReturnValueOnce([{ id: 2 }])

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new ActionHandlersLoader(dataPathProvider, logger)
    const result = await loader.loadActions(['a.json', 'b.json'])

    expect(loadJsonResource).toHaveBeenNthCalledWith(1, '/base/a.json', expect.anything(), logger)
    expect(loadJsonResource).toHaveBeenNthCalledWith(2, '/base/b.json', expect.anything(), logger)
    expect(mapHandlers).toHaveBeenNthCalledWith(1, schema1)
    expect(mapHandlers).toHaveBeenNthCalledWith(2, schema2)
    expect(result).toEqual([{ id: 1 }, { id: 2 }])
  })

  it('throws when no handler paths provided', async () => {
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new ActionHandlersLoader(dataPathProvider, logger)
    await expect(loader.loadActions([])).rejects.toThrow('No action handlers paths provided')
  })

  it('throws when loadJsonResource rejects', async () => {
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(loadJsonResource as unknown as Mock).mockImplementation(() => fatalError('fail'))

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new ActionHandlersLoader(dataPathProvider, logger)
    await expect(loader.loadActions(['a.json'])).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
    expect(mapHandlers).not.toHaveBeenCalled()
  })

  it('throws when loadJsonResource returns invalid data', async () => {
    ;(loadJsonResource as unknown as Mock).mockResolvedValue({})
    ;(fatalError as unknown as Mock).mockImplementation(() => {
      throw new Error('fatal')
    })
    ;(mapHandlers as unknown as Mock).mockImplementation(() => fatalError('invalid'))

    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const loader = new ActionHandlersLoader(dataPathProvider, logger)
    await expect(loader.loadActions(['a.json'])).rejects.toThrow('fatal')

    expect(fatalError).toHaveBeenCalled()
  })
})
