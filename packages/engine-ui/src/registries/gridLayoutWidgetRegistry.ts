import type {
  GridLayoutWidgetComponent,
  IGridLayoutWidgetRegistry,
} from './types'

export class GridLayoutWidgetRegistry implements IGridLayoutWidgetRegistry {
  private readonly registry: Map<string, GridLayoutWidgetComponent> = new Map()

  register(id: string, component: GridLayoutWidgetComponent): void {
    this.registry.set(id, component)
  }

  get(id: string): GridLayoutWidgetComponent | undefined {
    return this.registry.get(id)
  }

  has(id: string): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }
}
