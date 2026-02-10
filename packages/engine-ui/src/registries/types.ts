import type { ComponentType } from 'react'

export interface WidgetProps {
  widgetId: string
}

export type WidgetComponent =
  ComponentType<WidgetProps>

export interface SurfaceProps {
  surfaceId: string
}

export type SurfaceComponent =
  ComponentType<SurfaceProps>

export interface IWidgetRegistry {
  register(id: string, component: WidgetComponent): void
  get(id: string): WidgetComponent | undefined
  has(id: string): boolean
  reset(): void
}

export interface ISurfaceRegistry {
  register(id: string, component: SurfaceComponent): void
  get(id: string): SurfaceComponent | undefined
  has(id: string): boolean
  reset(): void
}
