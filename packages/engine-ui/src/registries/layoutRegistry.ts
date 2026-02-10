import type {
  LayoutComponent,
  ILayoutRegistry,
} from './types'

export class LayoutRegistry implements ILayoutRegistry {
  private readonly registry: Map<string, LayoutComponent> = new Map()

  register(id: string, component: LayoutComponent): void {
    this.registry.set(id, component)
  }

  get(id: string): LayoutComponent | undefined {
    return this.registry.get(id)
  }

  has(id: string): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }
}
