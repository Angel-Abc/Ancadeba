import { type Container } from '@ancadeba/utils'
import {
  bootServiceToken,
  worldServiceToken,
  bootProgressTrackerToken,
} from '../services/tokens'
import { BootService, bootServiceDependencies } from '../services/BootService'
import {
  WorldService,
  worldServiceDependencies,
} from '../services/WorldService'
import { BootProgressTracker } from '../services/BootProgressTracker'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: worldServiceToken,
      useClass: WorldService,
      deps: worldServiceDependencies,
      scope: 'singleton',
    },
    {
      token: bootProgressTrackerToken,
      useClass: BootProgressTracker,
      deps: [],
      scope: 'singleton',
    },
    {
      token: bootServiceToken,
      useClass: BootService,
      deps: bootServiceDependencies,
      scope: 'singleton',
    },
  ])
}
