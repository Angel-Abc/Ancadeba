import type { Widget } from '@ancadeba/content'
import { createElement } from 'react'
import type {
  IWidgetRegistry,
  WidgetComponent,
  WidgetRegistryEntries,
  WidgetType,
} from './types'

export class WidgetRegistry implements IWidgetRegistry {
  private readonly registry = new Map<WidgetType, WidgetComponent>()

  constructor(entries: WidgetRegistryEntries = {}) {
    for (const [id, component] of Object.entries(entries) as [
      WidgetType,
      WidgetComponent,
    ][]) {
      this.registry.set(id, component)
    }
  }

  register<TKey extends WidgetType>(
    id: TKey,
    component: WidgetComponent<TKey>,
  ): void {
    this.registry.set(id, component as WidgetComponent)
  }

  get<TKey extends WidgetType>(id: TKey): WidgetComponent<TKey> | undefined {
    return this.registry.get(id) as WidgetComponent<TKey> | undefined
  }

  has(id: WidgetType): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }

  render(widget: Widget): React.JSX.Element | null {
    switch (widget.type) {
      case 'progress': {
        const component = this.get('progress')
        return component ? createElement(component, { widget }) : null
      }
    }

    return null
  }
}
