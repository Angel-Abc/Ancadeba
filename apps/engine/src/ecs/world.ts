import { Token, token } from '@ancadeba/utils'
import {
  ComponentKey,
  EntityId,
  IWorld,
  IWorldEventBus,
  WORLD_EVENTS,
  WorldEvent,
  WorldEventPayloads,
} from './types'

const eventBusLogName = 'engine/ecs/WorldEventBus'
export const worldEventBusToken = token<IWorldEventBus>(eventBusLogName)
export const worldEventBusDependencies: Token<unknown>[] = []

export class WorldEventBus implements IWorldEventBus {
  private readonly subscribers: Map<
    WorldEvent,
    Set<(payload: WorldEventPayloads[WorldEvent]) => void>
  > = new Map()

  publish<Event extends WorldEvent>(
    event: Event,
    payload: WorldEventPayloads[Event]
  ): void {
    const eventSubscribers = this.subscribers.get(event)
    if (!eventSubscribers) {
      return
    }
    for (const callback of eventSubscribers) {
      callback(payload)
    }
  }

  subscribe<Event extends WorldEvent>(
    event: Event,
    handler: (payload: WorldEventPayloads[Event]) => void
  ): () => void {
    let eventSubscribers = this.subscribers.get(event)
    if (!eventSubscribers) {
      eventSubscribers = new Set()
      this.subscribers.set(event, eventSubscribers)
    }
    const typedHandler = handler as (
      payload: WorldEventPayloads[WorldEvent]
    ) => void
    eventSubscribers.add(typedHandler)
    return () => {
      eventSubscribers?.delete(typedHandler)
    }
  }
}

const logName = 'engine/ecs/World'
export const worldToken = token<IWorld>(logName)
export const worldDependencies: Token<unknown>[] = [worldEventBusToken]

export class World implements IWorld {
  private readonly entities: Set<EntityId> = new Set()
  private readonly componentStores: Map<ComponentKey, Map<EntityId, unknown>> =
    new Map()
  private nextEntityId = 1

  constructor(private readonly eventBus: IWorldEventBus) {}

  createEntity(): EntityId {
    const entityId = this.nextEntityId
    this.nextEntityId += 1
    this.entities.add(entityId)
    this.eventBus.publish(WORLD_EVENTS.ENTITY_CREATED, { entityId })
    return entityId
  }

  destroyEntity(entityId: EntityId): void {
    this.ensureEntity(entityId)
    const stores = Array.from(this.componentStores.entries())
    for (const [componentKey, store] of stores) {
      if (!store.has(entityId)) {
        continue
      }
      const component = store.get(entityId)
      store.delete(entityId)
      this.eventBus.publish(WORLD_EVENTS.COMPONENT_REMOVED, {
        entityId,
        componentKey,
        component,
      })
      if (store.size === 0) {
        this.componentStores.delete(componentKey)
      }
    }
    this.entities.delete(entityId)
    this.eventBus.publish(WORLD_EVENTS.ENTITY_DESTROYED, { entityId })
  }

  hasEntity(entityId: EntityId): boolean {
    return this.entities.has(entityId)
  }

  setComponent<T>(
    entityId: EntityId,
    componentKey: ComponentKey,
    component: T
  ): void {
    this.ensureEntity(entityId)
    const store = this.getComponentStore(componentKey)
    const hasComponent = store.has(entityId)
    const previous = store.get(entityId)
    store.set(entityId, component as unknown)

    if (hasComponent) {
      this.eventBus.publish(WORLD_EVENTS.COMPONENT_UPDATED, {
        entityId,
        componentKey,
        component,
        previous,
      })
      return
    }

    this.eventBus.publish(WORLD_EVENTS.COMPONENT_ADDED, {
      entityId,
      componentKey,
      component,
    })
  }

  removeComponent(entityId: EntityId, componentKey: ComponentKey): void {
    this.ensureEntity(entityId)
    const store = this.componentStores.get(componentKey)
    if (!store) {
      return
    }
    if (!store.has(entityId)) {
      return
    }
    const component = store.get(entityId)
    store.delete(entityId)
    this.eventBus.publish(WORLD_EVENTS.COMPONENT_REMOVED, {
      entityId,
      componentKey,
      component,
    })
    if (store.size === 0) {
      this.componentStores.delete(componentKey)
    }
  }

  getComponent<T>(
    entityId: EntityId,
    componentKey: ComponentKey
  ): T | undefined {
    this.ensureEntity(entityId)
    const store = this.componentStores.get(componentKey)
    return store?.get(entityId) as T | undefined
  }

  getEntitiesWith(...componentKeys: ComponentKey[]): EntityId[] {
    if (componentKeys.length === 0) {
      return this.getSortedEntities()
    }

    const stores = componentKeys.map((componentKey) =>
      this.componentStores.get(componentKey)
    )
    if (stores.some((store) => !store)) {
      return []
    }

    const seededStores = stores as Map<EntityId, unknown>[]
    seededStores.sort((left, right) => left.size - right.size)
    const [seedStore, ...restStores] = seededStores
    if (!seedStore) {
      return []
    }

    const results: EntityId[] = []
    for (const entityId of seedStore.keys()) {
      const hasAll = restStores.every((store) => store.has(entityId))
      if (!hasAll) {
        continue
      }
      results.push(entityId)
    }

    results.sort((left, right) => left - right)
    return results
  }

  subscribe<Event extends WorldEvent>(
    event: Event,
    handler: (payload: WorldEventPayloads[Event]) => void
  ): () => void {
    return this.eventBus.subscribe(event, handler)
  }

  private ensureEntity(entityId: EntityId): void {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity does not exist: ${entityId}`)
    }
  }

  private getSortedEntities(): EntityId[] {
    const entities = Array.from(this.entities)
    entities.sort((left, right) => left - right)
    return entities
  }

  private getComponentStore(
    componentKey: ComponentKey
  ): Map<EntityId, unknown> {
    let store = this.componentStores.get(componentKey)
    if (!store) {
      store = new Map()
      this.componentStores.set(componentKey, store)
    }
    return store
  }
}
