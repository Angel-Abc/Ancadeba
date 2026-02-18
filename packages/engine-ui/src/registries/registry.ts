import type { IRegistry } from './types'

export class Registry<TComponent> implements IRegistry<TComponent> {
  private readonly registry: Map<string, TComponent> = new Map()

  register(id: string, component: TComponent): void {
    this.registry.set(id, component)
  }

  get(id: string): TComponent | undefined {
    return this.registry.get(id)
  }

  has(id: string): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }
}
