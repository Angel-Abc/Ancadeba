import type { WidgetRegistryEntries } from '../registries/types'
import { ButtonBarWidget } from '../visuals/widgets/ButtonBarWidget'
import { ProgressWidget } from '../visuals/widgets/ProgressWidget'
import { SquaresMapWidget } from '../visuals/widgets/SquaresMapWidget'
import { TitleWidget } from '../visuals/widgets/TitleWidget'

export const knownWidgets: WidgetRegistryEntries = {
  'button-bar': ButtonBarWidget,
  progress: ProgressWidget,
  'squares-map': SquaresMapWidget,
  title: TitleWidget,
}
