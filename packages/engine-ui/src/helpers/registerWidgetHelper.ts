import type { WidgetRegistryEntries } from '../registries/types'
import { ProgressWidget } from '../visuals/widgets/ProgressWidget'

export const knownWidgets: WidgetRegistryEntries = {
  progress: ProgressWidget,
}
