import { describe, it, expect, vi } from 'vitest'
import { GameEngine } from '../../engine/engine/gameEngine'
import type { IEngineInitializer } from '../../engine/engine/engineInitializer'

describe('GameEngine', () => {
  it('calls initializer once when started', async () => {
    const initialize = vi.fn()
    const initializer = { initialize } as unknown as IEngineInitializer
    const engine = new GameEngine(initializer)

    await engine.start()

    expect(initialize).toHaveBeenCalledTimes(1)
  })
})
