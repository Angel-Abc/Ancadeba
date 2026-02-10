import type {
  WidgetComponent,
  IWidgetRegistry,
} from './types'

export class WidgetRegistry implements IWidgetRegistry {
  private readonly registry: Map<string, WidgetComponent> = new Map()

  register(id: string, component: WidgetComponent): void {
    this.registry.set(id, component)
  }

  get(id: string): WidgetComponent | undefined {
    return this.registry.get(id)
  }

  has(id: string): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }
}
