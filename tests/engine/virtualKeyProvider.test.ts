import { describe, it, expect, vi } from 'vitest'
import { VIRTUAL_INPUT } from '../../engine/messages/system'
import { VirtualKeyProvider } from '../../engine/providers/virtualKeyProvider'
import type { IKeyboardEventListener } from '../../utils/keyboardEventListener'
import type { IMessageBus } from '../../utils/messageBus'
import type { IVirtualKeysLoader } from '../../engine/loader/virtualKeysLoader'
import type { IGameDataProvider } from '../../engine/providers/gameDataProvider'

describe('VirtualKeyProvider', () => {
  it('initialize loads keys, registers listener, and posts VIRTUAL_INPUT messages', async () => {
    const cleanup = vi.fn()
    const addListener = vi.fn().mockReturnValue(cleanup)
    const keyboardEventListener = { addListener } as unknown as IKeyboardEventListener

    const postMessage = vi.fn()
    const messageBus = { postMessage } as unknown as IMessageBus

    const keys = [
      { virtualKey: 'jump', keyCode: 'Space', alt: false, ctrl: false, shift: false }
    ]
    const loadVirtualKeys = vi.fn().mockResolvedValue(keys)
    const virtualKeysLoader = { loadVirtualKeys } as unknown as IVirtualKeysLoader

    const gameDataProvider = {
      Game: {
        game: { virtualKeys: ['path'] } as unknown,
        loadedLanguages: {},
        loadedPages: {},
        loadedMaps: {},
        loadedTiles: new Map(),
        loadedTileSets: new Set(),
        loadedVirtualKeys: new Map()
      }
    } as unknown as IGameDataProvider

    const provider = new VirtualKeyProvider(
      keyboardEventListener,
      messageBus,
      virtualKeysLoader,
      gameDataProvider
    )

    await provider.initialize()

    expect(loadVirtualKeys).toHaveBeenCalledWith(['path'])
    expect(addListener).toHaveBeenCalledTimes(1)

    const handler = addListener.mock.calls[0][0]
    handler({ code: 'Space', alt: false, ctrl: false, shift: false })
    expect(postMessage).toHaveBeenCalledWith({ message: VIRTUAL_INPUT, payload: 'jump' })
  })

  it('cleanup unregisters the listener', async () => {
    const cleanup = vi.fn()
    const addListener = vi.fn().mockReturnValue(cleanup)
    const keyboardEventListener = { addListener } as unknown as IKeyboardEventListener

    const messageBus = { postMessage: vi.fn() } as unknown as IMessageBus
    const virtualKeysLoader = { loadVirtualKeys: vi.fn().mockResolvedValue([]) } as unknown as IVirtualKeysLoader
    const gameDataProvider = {
      Game: {
        game: { virtualKeys: [] } as unknown,
        loadedLanguages: {},
        loadedPages: {},
        loadedMaps: {},
        loadedTiles: new Map(),
        loadedTileSets: new Set(),
        loadedVirtualKeys: new Map()
      }
    } as unknown as IGameDataProvider

    const provider = new VirtualKeyProvider(
      keyboardEventListener,
      messageBus,
      virtualKeysLoader,
      gameDataProvider
    )

    await provider.initialize()
    provider.cleanup()
    expect(cleanup).toHaveBeenCalledTimes(1)

    provider.cleanup()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })
})

