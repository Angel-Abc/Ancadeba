import { token } from '@ancadeba/utils'

export interface IStartable {
  start(): void
}

export interface IStoppable {
  stop(): void
}

export interface ILifecycleCoordinator {
  start(): void
  stop(): void
}

const logName = 'engine/core/LifecycleCoordinator'
export const lifecycleCoordinatorToken = token<ILifecycleCoordinator>(logName)

export class LifecycleCoordinator implements ILifecycleCoordinator {
  constructor(
    private readonly startables: IStartable[],
    private readonly stoppables: IStoppable[]
  ) {}

  start(): void {
    this.startables.forEach((startable) => {
      startable.start()
    })
  }

  stop(): void {
    this.stoppables.forEach((stoppable) => {
      stoppable.stop()
    })
  }
}
