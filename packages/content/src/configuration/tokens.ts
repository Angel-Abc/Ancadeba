import { token } from '@ancadeba/utils'
import {
  type IResourcesConfiguration,
  ResourcesConfigurationLogName,
} from './types'

export const resourcesConfigurationToken = token<IResourcesConfiguration>(
  ResourcesConfigurationLogName,
)
