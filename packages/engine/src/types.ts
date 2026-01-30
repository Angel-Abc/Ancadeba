/**
 * Unique identifier for an entity.
 * Entities are represented as simple incrementing numbers for determinism.
 */
export type Entity = number

/**
 * Base interface for all components.
 * Components are pure data containers with no behavior.
 */
export interface Component {
  // Marker interface - components can have any structure
}

/**
 * Constructor type for component classes.
 */
export type ComponentConstructor<T extends Component = Component> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]) => T

/**
 * Interface for systems that process entities with specific components.
 * Systems contain the behavior/logic that operates on component data.
 */
export interface System {
  /**
   * Called once per turn to update system logic.
   */
  update(): void
}
