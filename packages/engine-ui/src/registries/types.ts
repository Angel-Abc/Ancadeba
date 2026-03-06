import type { Layout, Widget } from '@ancadeba/content'
import type { ComponentType } from 'react'

export type WidgetProps<TWidget extends Widget = Widget> = {
  widget: TWidget
}

export type WidgetType = Widget['type']

export type WidgetByType = {
  [TKey in WidgetType]: Extract<Widget, { type: TKey }>
}

export type WidgetComponent<TKey extends WidgetType = WidgetType> = ComponentType<
  WidgetProps<WidgetByType[TKey]>
>

export type WidgetComponentMap = {
  [TKey in WidgetType]: WidgetComponent<TKey>
}

export type WidgetRegistryEntries = Partial<WidgetComponentMap>

export type LayoutProps<TLayout extends Layout = Layout> = {
  layout: TLayout
}

export type LayoutType = Layout['type']

export type LayoutByType = {
  [TKey in LayoutType]: Extract<Layout, { type: TKey }>
}

export type LayoutComponent<TKey extends LayoutType = LayoutType> = ComponentType<
  LayoutProps<LayoutByType[TKey]>
>

export type LayoutComponentMap = {
  [TKey in LayoutType]: LayoutComponent<TKey>
}

export type LayoutRegistryEntries = Partial<LayoutComponentMap>

export interface IRegistry<TKey extends string, TComponent> {
  register(id: TKey, component: TComponent): void
  get(id: TKey): TComponent | undefined
  has(id: TKey): boolean
  reset(): void
}

export interface IWidgetRegistry {
  register<TKey extends WidgetType>(
    id: TKey,
    component: WidgetComponent<TKey>,
  ): void
  get<TKey extends WidgetType>(id: TKey): WidgetComponent<TKey> | undefined
  has(id: WidgetType): boolean
  reset(): void
  render(widget: Widget): React.JSX.Element | null
}

export interface ILayoutRegistry {
  register<TKey extends LayoutType>(
    id: TKey,
    component: LayoutComponent<TKey>,
  ): void
  get<TKey extends LayoutType>(id: TKey): LayoutComponent<TKey> | undefined
  has(id: LayoutType): boolean
  reset(): void
  render(layout: Layout): React.JSX.Element | null
}
