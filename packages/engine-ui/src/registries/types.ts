import type { ComponentType } from 'react'

export interface WidgetProps {
  widgetId: string
}

export type WidgetComponent =
  ComponentType<WidgetProps>

export interface LayoutProps {
  layoutType: string
}

export type LayoutComponent =
  ComponentType<LayoutProps>

export interface IWidgetRegistry {
  register(id: string, component: WidgetComponent): void
  get(id: string): WidgetComponent | undefined
  has(id: string): boolean
  reset(): void
}

export interface ILayoutRegistry {
  register(id: string, component: LayoutComponent): void
  get(id: string): LayoutComponent | undefined
  has(id: string): boolean
  reset(): void
}
