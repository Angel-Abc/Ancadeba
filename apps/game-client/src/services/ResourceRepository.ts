import type { Surface, WidgetDefinition } from '@ancadeba/content'

/**
 * Stores and provides access to loaded game resources.
 * Single responsibility: Resource storage and retrieval.
 */
export class ResourceRepository {
  private surfaces: Map<string, Surface> = new Map()
  private widgetDefinitions: Record<string, WidgetDefinition> = {}
  private bootSurface: Surface | null = null

  setSurfaces(surfaces: Surface[]): void {
    this.surfaces.clear()
    for (const surface of surfaces) {
      this.surfaces.set(surface.id, surface)
    }
  }

  setBootSurface(surface: Surface): void {
    this.bootSurface = surface
  }

  getBootSurface(): Surface | null {
    return this.bootSurface
  }

  getSurface(id: string): Surface | null {
    return this.surfaces.get(id) ?? null
  }

  getAllSurfaces(): Surface[] {
    return Array.from(this.surfaces.values())
  }

  setWidgetDefinitions(definitions: WidgetDefinition[]): void {
    this.widgetDefinitions = definitions.reduce(
      (acc, widget) => {
        acc[widget.id] = widget
        return acc
      },
      {} as Record<string, WidgetDefinition>,
    )
  }

  getWidgetDefinitions(): Record<string, WidgetDefinition> {
    return this.widgetDefinitions
  }
}
