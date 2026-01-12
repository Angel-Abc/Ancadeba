import { Token, token } from '@ancadeba/utils'
import { ISystem } from '../ecs/types'
import {
  ISystemRegistry,
  systemRegistryToken,
} from '../ecs/systemRegistry'
import { IStartable, IStoppable } from './lifecycleCoordinator'

export interface IEcsCoordinator extends IStartable, IStoppable {}

const logName = 'engine/core/EcsCoordinator'
export const ecsCoordinatorToken = token<IEcsCoordinator>(logName)
export const ecsCoordinatorDependencies: Token<unknown>[] = [systemRegistryToken]

export class EcsCoordinator implements IEcsCoordinator {
  private startedSystems: ISystem[] = []

  constructor(private readonly systemRegistry: ISystemRegistry) {}

  start(): void {
    const systems = this.systemRegistry.getSystems()
    this.startedSystems = systems
    systems.forEach((system) => {
      system.start()
    })
  }

  stop(): void {
    const systems =
      this.startedSystems.length > 0
        ? this.startedSystems
        : this.systemRegistry.getSystems()
    systems
      .slice()
      .reverse()
      .forEach((system) => {
        system.stop()
      })
    this.startedSystems = []
  }
}
