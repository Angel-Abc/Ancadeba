import type {
  SurfaceComponent,
  ISurfaceRegistry,
} from './types'

export class SurfaceRegistry implements ISurfaceRegistry {
  private readonly registry: Map<string, SurfaceComponent> = new Map()

  register(id: string, component: SurfaceComponent): void {
    this.registry.set(id, component)
  }

  get(id: string): SurfaceComponent | undefined {
    return this.registry.get(id)
  }

  has(id: string): boolean {
    return this.registry.has(id)
  }

  reset(): void {
    this.registry.clear()
  }
}
