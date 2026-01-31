import { token } from '@ancadeba/utils'
import { type IWidgetRegistry, WidgetRegistryLogName } from './types'

export const widgetRegistryToken = token<IWidgetRegistry>(WidgetRegistryLogName)
