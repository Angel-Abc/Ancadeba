import { Token, token } from '@ancadeba/utils'
import { ISystem, SystemRegistrationOptions } from './types'

export interface ISystemRegistry {
  register(system: ISystem, options?: SystemRegistrationOptions): void
  getSystems(): ISystem[]
}

const logName = 'engine/ecs/SystemRegistry'
export const systemRegistryToken = token<ISystemRegistry>(logName)
export const systemRegistryDependencies: Token<unknown>[] = []

type RegisteredSystem = {
  system: ISystem
  priority: number
  order: number
}

export class SystemRegistry implements ISystemRegistry {
  private readonly systems: RegisteredSystem[] = []
  private nextOrder = 0

  register(system: ISystem, options?: SystemRegistrationOptions): void {
    const priority = options?.priority ?? 0
    this.systems.push({ system, priority, order: this.nextOrder })
    this.nextOrder += 1
  }

  getSystems(): ISystem[] {
    return this.systems
      .slice()
      .sort((left, right) => {
        if (left.priority === right.priority) {
          return left.order - right.order
        }
        return left.priority - right.priority
      })
      .map(({ system }) => system)
  }
}
