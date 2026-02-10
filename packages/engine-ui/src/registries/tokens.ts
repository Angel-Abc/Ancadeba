import { token } from '@ancadeba/utils'
import type { IGridLayoutWidgetRegistry } from './types'

export const gridLayoutWidgetRegistryToken = token<IGridLayoutWidgetRegistry>(
  'engine-ui/registries/gridLayoutWidgetRegistry',
)
