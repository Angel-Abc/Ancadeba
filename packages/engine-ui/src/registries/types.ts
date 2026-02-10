import type { ComponentType } from 'react'

export interface GridLayoutWidgetProps {
  widgetId: string
}

export type GridLayoutWidgetComponent =
  ComponentType<GridLayoutWidgetProps>

export interface IGridLayoutWidgetRegistry {
  register(id: string, component: GridLayoutWidgetComponent): void
  get(id: string): GridLayoutWidgetComponent | undefined
  has(id: string): boolean
  reset(): void
}
