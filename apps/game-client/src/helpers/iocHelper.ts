import { type Container } from '@ancadeba/utils'
import {
  bootServiceToken,
  worldServiceToken,
  bootProgressTrackerToken,
  resourceRepositoryToken,
  surfaceSelectorToken,
} from '../services/tokens'
import { BootService, bootServiceDependencies } from '../services/BootService'
import {
  WorldService,
  worldServiceDependencies,
} from '../services/WorldService'
import { BootProgressTracker } from '../services/BootProgressTracker'
import { ResourceRepository } from '../services/ResourceRepository'
import { SurfaceSelector } from '../services/SurfaceSelector'

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
      token: resourceRepositoryToken,
      useClass: ResourceRepository,
      deps: [],
      scope: 'singleton',
    },
    {
      token: surfaceSelectorToken,
      useClass: SurfaceSelector,
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
