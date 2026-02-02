import { token } from '@ancadeba/utils'
import { IResourceConfiguration } from './types'

export const resourceConfigurationToken = token<IResourceConfiguration>(
  'content/configuration/resourceConfiguration',
)
