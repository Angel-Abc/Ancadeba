import { type Container } from '@ancadeba/utils'
import { bootServiceToken } from '../services/tokens'
import { BootService, bootServiceDependencies } from '../services/BootService'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: bootServiceToken,
      useClass: BootService,
      deps: bootServiceDependencies,
      scope: 'singleton',
    },
  ])
}
