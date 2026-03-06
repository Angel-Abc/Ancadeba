import type { Layout } from '@ancadeba/content'
import { createElement } from 'react'
import type {
  ILayoutRegistry,
  LayoutComponent,
  LayoutType,
  LayoutRegistryEntries,
} from './types'

export class LayoutRegistry implements ILayoutRegistry {
  private readonly registry = new Map<LayoutType, LayoutComponent>()

  constructor(entries: LayoutRegistryEntries = {}) {
    for (const [id, component] of Object.entries(entries) as [
      LayoutType,
      LayoutComponent,
    ][]) {
      this.registry.set(id, component)
    }
  }

  register<TKey extends LayoutType>(
    id: TKey,
    component: LayoutComponent<TKey>,
  ): void {
    this.registry.set(id, component as LayoutComponent)
  }

  get<TKey extends LayoutType>(id: TKey): LayoutComponent<TKey> | undefined {
    return this.registry.get(id) as LayoutComponent<TKey> | undefined
  }

  has(id: LayoutType): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }

  render(layout: Layout): React.JSX.Element | null {
    switch (layout.type) {
      case 'grid': {
        const component = this.get('grid')
        return component ? createElement(component, { layout }) : null
      }
    }

    return null
  }
}
