import type { Surface } from '@ancadeba/content'

/**
 * Responsible for identifying specific surfaces based on capability requirements.
 * Single responsibility: Surface selection logic.
 */
export class SurfaceSelector {
  /**
   * Finds the boot surface from a list of surfaces.
   * Boot surface must require 'boot:progress' and forbid 'ecs:projections'.
   */
  findBootSurface(surfaces: Surface[]): Surface | null {
    return (
      surfaces.find(
        (s) =>
          s.requires?.includes('boot:progress') &&
          ((s.forbids ?? []).includes('ecs:projections') ||
            !(s.requires ?? []).includes('ecs:projections')),
      ) ?? null
    )
  }
}
