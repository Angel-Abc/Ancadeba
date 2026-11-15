import { describe, expect, it, vi } from 'vite-plus/test'
import { GameTiming } from '../packages/game-runtime/src/gameTiming.js'

describe('pausable gameplay timing', () => {
  it('excludes menu time from the clock and resumes pending and newly scheduled work', () => {
    let time = 0
    const tasks = new Set<{ callback: () => void; due: number }>()

    const timing = new GameTiming(
      {
        schedule(callback, delay) {
          const task = { callback, due: time + delay }
          tasks.add(task)

          return () => {
            tasks.delete(task)
          }
        },
      },
      { now: () => time },
    )

    const advance = (ms: number) => {
      time += ms

      for (const task of [...tasks])
        if (task.due <= time) {
          tasks.delete(task)
          task.callback()
        }
    }

    const pending = vi.fn()
    const added = vi.fn()
    timing.schedule(pending, 1000)
    advance(400)
    timing.setPaused(true)
    timing.setPaused(true)
    timing.schedule(added, 200)
    advance(10_000)
    expect(timing.now()).toBe(400)
    expect(pending).not.toHaveBeenCalled()
    timing.setPaused(false)
    advance(200)
    expect(added).toHaveBeenCalledOnce()
    advance(399)
    expect(pending).not.toHaveBeenCalled()
    advance(1)
    expect(pending).toHaveBeenCalledOnce()
    expect(timing.now()).toBe(1000)
    timing.setPaused(true)
    timing.schedule(pending, 0)
    timing.dispose()
    timing.setPaused(false)
    advance(1000)
    expect(pending).toHaveBeenCalledOnce()
  })
})
