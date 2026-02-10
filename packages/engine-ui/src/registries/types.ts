import type { ComponentType } from 'react'

export interface WidgetProps {
  widgetId: string
}

export type WidgetComponent =
  ComponentType<WidgetProps>

export interface IWidgetRegistry {
  register(id: string, component: WidgetComponent): void
  get(id: string): WidgetComponent | undefined
  has(id: string): boolean
  reset(): void
}
