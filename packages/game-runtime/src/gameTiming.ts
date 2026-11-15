import type { IMonotonicClock, ITaskScheduler } from '@ancadeba/utilities'

interface GameplayTask {
  due: number
  callback: () => void
  cancel?: () => void
  token?: object | undefined
}

/** A playthrough clock and scheduler that retain remaining delays while a menu is open. */
export class GameTiming implements ITaskScheduler, IMonotonicClock {
  private pausedAt: number | undefined
  private offset = 0
  private disposed = false
  private readonly tasks = new Set<GameplayTask>()

  constructor(
    private readonly scheduler: ITaskScheduler,
    private readonly clock: IMonotonicClock,
  ) {}

  now(): number {
    return (this.pausedAt ?? this.clock.now()) - this.offset
  }

  schedule(callback: () => void, delayMs: number): () => void {
    if (this.disposed) return () => {}

    const task: GameplayTask = { due: this.now() + delayMs, callback }
    this.tasks.add(task)
    this.arm(task)

    return () => {
      if (this.tasks.delete(task)) task.cancel?.()
    }
  }

  setPaused(paused: boolean): void {
    if (this.disposed || paused === (this.pausedAt !== undefined)) return

    if (paused) {
      this.pausedAt = this.clock.now()

      for (const task of this.tasks) {
        task.token = undefined
        task.cancel?.()
      }
    } else {
      this.offset += this.clock.now() - this.pausedAt!
      this.pausedAt = undefined

      for (const task of this.tasks) this.arm(task)
    }
  }

  dispose(): void {
    this.disposed = true

    for (const task of this.tasks) task.cancel?.()
    this.tasks.clear()
  }

  private arm(task: GameplayTask): void {
    if (this.pausedAt !== undefined) return
    const token = {}
    task.token = token
    task.cancel = this.scheduler.schedule(
      () => {
        if (
          this.disposed ||
          this.pausedAt !== undefined ||
          task.token !== token ||
          !this.tasks.delete(task)
        )
          return
        task.callback()
      },
      Math.max(0, task.due - this.now()),
    )
  }
}
