import { describe, it, expect, vi } from 'vitest'
import { VIRTUAL_INPUT, VIRTUAL_KEY } from '../../engine/messages/system'
import { VirtualInputProvider } from '../../engine/providers/virtualInputProvider'
import type { IVirtualInputsLoader } from '../../engine/loader/virtualInputsLoader'
import type { IMessageBus } from '../../utils/messageBus'
import type { IGameDataProvider } from '../../engine/providers/gameDataProvider'

// Tests for VirtualInputProvider

describe('VirtualInputProvider', () => {
  it('initialize loads inputs when needed, registers listener and posts VIRTUAL_INPUT messages', async () => {
    const loadVirtualInputs = vi.fn().mockResolvedValue([
      { virtualInput: 'jump', virtualKeys: ['VK_JUMP'], label: 'Jump' }
    ])
    const virtualInputsLoader = { loadVirtualInputs } as unknown as IVirtualInputsLoader

    const cleanup = vi.fn()
    const registerMessageListener = vi.fn().mockReturnValue(cleanup)
    const postMessage = vi.fn()
    const messageBus = { registerMessageListener, postMessage } as unknown as IMessageBus

    const gameDataProvider = {
      Game: {
        game: { virtualInputs: ['inputs.json'] } as unknown,
        loadedLanguages: {},
        loadedPages: {},
        loadedMaps: {},
        loadedTiles: new Map(),
        loadedTileSets: new Set(),
        loadedVirtualKeys: new Map(),
        loadedVirtualInputsByInput: new Map(),
        loadedVirtualInputsByKey: new Map()
      }
    } as unknown as IGameDataProvider

    const provider = new VirtualInputProvider(
      virtualInputsLoader,
      messageBus,
      gameDataProvider
    )

    await provider.initialize()

    expect(loadVirtualInputs).toHaveBeenCalledWith(['inputs.json'])
    expect(registerMessageListener).toHaveBeenCalledWith(VIRTUAL_KEY, expect.any(Function))

    const handler = registerMessageListener.mock.calls[0][1] as (msg: { message: string, payload: unknown }) => void
    handler({ message: VIRTUAL_KEY, payload: 'VK_JUMP' })
    expect(postMessage).toHaveBeenCalledWith({ message: VIRTUAL_INPUT, payload: 'jump' })
  })

  it('cleanup unregisters the listener', async () => {
    const loadVirtualInputs = vi.fn().mockResolvedValue([])
    const virtualInputsLoader = { loadVirtualInputs } as unknown as IVirtualInputsLoader

    const cleanup = vi.fn()
    const registerMessageListener = vi.fn().mockReturnValue(cleanup)
    const postMessage = vi.fn()
    const messageBus = { registerMessageListener, postMessage } as unknown as IMessageBus

    const gameDataProvider = {
      Game: {
        game: { virtualInputs: ['inputs.json'] } as unknown,
        loadedLanguages: {},
        loadedPages: {},
        loadedMaps: {},
        loadedTiles: new Map(),
        loadedTileSets: new Set(),
        loadedVirtualKeys: new Map(),
        loadedVirtualInputsByInput: new Map(),
        loadedVirtualInputsByKey: new Map()
      }
    } as unknown as IGameDataProvider

    const provider = new VirtualInputProvider(
      virtualInputsLoader,
      messageBus,
      gameDataProvider
    )

    await provider.initialize()
    provider.cleanup()
    expect(cleanup).toHaveBeenCalledTimes(1)

    provider.cleanup()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})

