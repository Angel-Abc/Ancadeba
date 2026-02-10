import { token } from '@ancadeba/utils'
import type { IWidgetRegistry } from './types'

export const widgetRegistryToken = token<IWidgetRegistry>(
  'engine-ui/registries/widgetRegistry',
)
