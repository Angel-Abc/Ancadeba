import type { IRegistry } from './types'

export class Registry<TKey extends string, TComponent>
  implements IRegistry<TKey, TComponent>
{
  private readonly registry: Map<TKey, TComponent> = new Map()

  constructor(entries: Partial<Record<TKey, TComponent>> = {}) {
    for (const [id, component] of Object.entries(entries) as [
      TKey,
      TComponent,
    ][]) {
      this.registry.set(id, component)
    }
  }

  register(id: TKey, component: TComponent): void {
    this.registry.set(id, component)
  }

  get(id: TKey): TComponent | undefined {
    return this.registry.get(id)
  }

  has(id: TKey): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }
}
