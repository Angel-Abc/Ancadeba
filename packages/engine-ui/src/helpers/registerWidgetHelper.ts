import type { WidgetComponentMap } from '../registries/types'
import { ProgressWidget } from '../visuals/widgets/ProgressWidget'

export const knownWidgets: WidgetComponentMap = {
  progress: ProgressWidget,
}
