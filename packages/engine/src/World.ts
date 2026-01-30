import type { Component, ComponentConstructor, Entity, System } from './types'

/**
 * Core ECS World that manages entities, components, and systems.
 * Provides deterministic entity ID generation and component storage.
 */
export class World {
  private nextEntityId: Entity = 1
  private readonly entities: Set<Entity> = new Set()
  private readonly componentsByType: Map<
    ComponentConstructor,
    Map<Entity, Component>
  > = new Map()
  private readonly systems: System[] = []

  /**
   * Create a new entity with a deterministic incrementing ID.
   * @returns The new entity ID
   */
  createEntity(): Entity {
    const entity = this.nextEntityId++
    this.entities.add(entity)
    return entity
  }

  /**
   * Destroy an entity and remove all its components.
   * @param entity - The entity to destroy
   */
  destroyEntity(entity: Entity): void {
    if (!this.entities.has(entity)) {
      return
    }

    this.entities.delete(entity)

    // Remove all components associated with this entity
    for (const componentsMap of this.componentsByType.values()) {
      componentsMap.delete(entity)
    }
  }

  /**
   * Check if an entity exists in the world.
   * @param entity - The entity to check
   * @returns True if the entity exists
   */
  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity)
  }

  /**
   * Get all entities in the world.
   * @returns Array of all entity IDs
   */
  getEntities(): Entity[] {
    return Array.from(this.entities)
  }

  /**
   * Add a component to an entity.
   * Replaces existing component of the same type if present.
   * @param entity - The entity to add the component to
   * @param componentType - The constructor of the component type
   * @param component - The component instance to add
   */
  addComponent<T extends Component>(
    entity: Entity,
    componentType: ComponentConstructor<T>,
    component: T,
  ): void {
    if (!this.entities.has(entity)) {
      throw new Error(`Entity ${entity} does not exist`)
    }

    let componentsMap = this.componentsByType.get(componentType)
    if (!componentsMap) {
      componentsMap = new Map()
      this.componentsByType.set(componentType, componentsMap)
    }

    componentsMap.set(entity, component)
  }

  /**
   * Remove a component from an entity.
   * @param entity - The entity to remove the component from
   * @param componentType - The constructor of the component type
   */
  removeComponent<T extends Component>(
    entity: Entity,
    componentType: ComponentConstructor<T>,
  ): void {
    const componentsMap = this.componentsByType.get(componentType)
    if (componentsMap) {
      componentsMap.delete(entity)
    }
  }

  /**
   * Get a component from an entity.
   * @param entity - The entity to get the component from
   * @param componentType - The constructor of the component type
   * @returns The component instance or undefined if not found
   */
  getComponent<T extends Component>(
    entity: Entity,
    componentType: ComponentConstructor<T>,
  ): T | undefined {
    const componentsMap = this.componentsByType.get(componentType)
    return componentsMap?.get(entity) as T | undefined
  }

  /**
   * Check if an entity has a component.
   * @param entity - The entity to check
   * @param componentType - The constructor of the component type
   * @returns True if the entity has the component
   */
  hasComponent<T extends Component>(
    entity: Entity,
    componentType: ComponentConstructor<T>,
  ): boolean {
    const componentsMap = this.componentsByType.get(componentType)
    return componentsMap?.has(entity) ?? false
  }

  /**
   * Query all entities that have a specific component.
   * @param componentType - The constructor of the component type
   * @returns Array of entity IDs that have the component
   */
  queryEntities<T extends Component>(
    componentType: ComponentConstructor<T>,
  ): Entity[] {
    const componentsMap = this.componentsByType.get(componentType)
    if (!componentsMap) {
      return []
    }
    return Array.from(componentsMap.keys())
  }

  /**
   * Query all entities that have all specified components.
   * @param componentTypes - Array of component constructors
   * @returns Array of entity IDs that have all the components
   */
  queryEntitiesWithAll(componentTypes: ComponentConstructor[]): Entity[] {
    if (componentTypes.length === 0) {
      return []
    }

    const firstComponentType = componentTypes[0]
    if (!firstComponentType) {
      return []
    }

    // Start with entities that have the first component
    const firstComponentMap = this.componentsByType.get(firstComponentType)
    if (!firstComponentMap) {
      return []
    }

    const candidates = Array.from(firstComponentMap.keys())

    // Filter candidates to only those that have all other components
    return candidates.filter((entity) => {
      return componentTypes.slice(1).every((componentType) => {
        return (
          componentType !== undefined &&
          this.hasComponent(entity, componentType)
        )
      })
    })
  }

  /**
   * Register a system to be updated.
   * @param system - The system to register
   */
  addSystem(system: System): void {
    this.systems.push(system)
  }

  /**
   * Remove a system from updates.
   * @param system - The system to remove
   */
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system)
    if (index !== -1) {
      this.systems.splice(index, 1)
    }
  }

  /**
   * Update all registered systems.
   */
  update(): void {
    for (const system of this.systems) {
      system.update()
    }
  }

  /**
   * Clear all entities, components, and systems.
   * Resets entity ID generation to 1.
   */
  clear(): void {
    this.nextEntityId = 1
    this.entities.clear()
    this.componentsByType.clear()
    this.systems.length = 0
  }
}
