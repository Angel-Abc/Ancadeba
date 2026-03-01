import { LayoutComponent } from '../registries/types'
import { GridLayout } from '../visuals/layouts/GridLayout'

export const knownLayouts: Record<string, LayoutComponent> = {
  grid: GridLayout,
}
