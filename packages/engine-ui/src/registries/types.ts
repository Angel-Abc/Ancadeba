import type { ComponentType } from 'react'

export interface WidgetProps {
  widgetId: string
}

export type WidgetComponent = ComponentType<WidgetProps>

export interface LayoutProps {
  layoutType: string
}

export type LayoutComponent = ComponentType<LayoutProps>

export interface IRegistry<TComponent> {
  register(id: string, component: TComponent): void
  get(id: string): TComponent | undefined
  has(id: string): boolean
  reset(): void
}

export type IWidgetRegistry = IRegistry<WidgetComponent>

export type ILayoutRegistry = IRegistry<LayoutComponent>
