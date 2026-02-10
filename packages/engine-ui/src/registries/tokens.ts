import { token } from '@ancadeba/utils'
import type {
  IWidgetRegistry,
  ILayoutRegistry,
} from './types'

export const widgetRegistryToken = token<IWidgetRegistry>(
  'engine-ui/registries/widgetRegistry',
)

export const layoutRegistryToken = token<ILayoutRegistry>(
  'engine-ui/registries/layoutRegistry',
)
