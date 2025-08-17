import { describe, it, expect, vi } from 'vitest'
import { GameEngine } from '@engine/gameEngine'
import type { IEngineInitializer } from '@engine/engineInitializer'
import type { ILogger } from '@utils/logger'

describe('GameEngine', () => {
  it('calls initializer once when started', async () => {
    const initialize = vi.fn()
    const initializer = { initialize } as unknown as IEngineInitializer
    const logger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const engine = new GameEngine(initializer, logger)

    await engine.start()

    expect(initialize).toHaveBeenCalledTimes(1)
  })
})
