import type { WidgetRegistryEntries } from '../registries/types'
import { ButtonBarWidget } from '../visuals/widgets/ButtonBarWidget'
import { ProgressWidget } from '../visuals/widgets/ProgressWidget'
import { TitleWidget } from '../visuals/widgets/TitleWidget'

export const knownWidgets: WidgetRegistryEntries = {
  'button-bar': ButtonBarWidget,
  progress: ProgressWidget,
  title: TitleWidget,
}
