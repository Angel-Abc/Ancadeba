import { token } from '@ancadeba/utils'
import type {
  IWidgetRegistry,
  ISurfaceRegistry,
} from './types'

export const widgetRegistryToken = token<IWidgetRegistry>(
  'engine-ui/registries/widgetRegistry',
)

export const surfaceRegistryToken = token<ISurfaceRegistry>(
  'engine-ui/registries/surfaceRegistry',
)
