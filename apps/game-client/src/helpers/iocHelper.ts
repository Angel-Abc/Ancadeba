import { type Container } from '@ancadeba/utils'
import {
  bootServiceToken,
  resourcesConfigurationToken,
} from '../services/types'
import { BootService, bootServiceDependencies } from '../services/BootService'
import { ResourcesConfiguration } from '../services/ResourcesConfiguration'

export function registerServices(
  container: Container,
  resourcesDataPath: string,
): void {
  container.registerAll([
    {
      token: resourcesConfigurationToken,
      useValue: new ResourcesConfiguration(resourcesDataPath),
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
