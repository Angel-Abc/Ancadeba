export type EntityId = number
export type ComponentKey = string

export const WORLD_EVENTS = {
  ENTITY_CREATED: 'ECS/ENTITY_CREATED',
  ENTITY_DESTROYED: 'ECS/ENTITY_DESTROYED',
  COMPONENT_ADDED: 'ECS/COMPONENT_ADDED',
  COMPONENT_REMOVED: 'ECS/COMPONENT_REMOVED',
  COMPONENT_UPDATED: 'ECS/COMPONENT_UPDATED',
} as const

export type WorldEvent = (typeof WORLD_EVENTS)[keyof typeof WORLD_EVENTS]

export type WorldEventPayloads = {
  [WORLD_EVENTS.ENTITY_CREATED]: { entityId: EntityId }
  [WORLD_EVENTS.ENTITY_DESTROYED]: { entityId: EntityId }
  [WORLD_EVENTS.COMPONENT_ADDED]: {
    entityId: EntityId
    componentKey: ComponentKey
    component: unknown
  }
  [WORLD_EVENTS.COMPONENT_REMOVED]: {
    entityId: EntityId
    componentKey: ComponentKey
    component: unknown
  }
  [WORLD_EVENTS.COMPONENT_UPDATED]: {
    entityId: EntityId
    componentKey: ComponentKey
    component: unknown
    previous: unknown
  }
}

export interface IWorldEventBus {
  publish<Event extends WorldEvent>(
    event: Event,
    payload: WorldEventPayloads[Event]
  ): void
  subscribe<Event extends WorldEvent>(
    event: Event,
    handler: (payload: WorldEventPayloads[Event]) => void
  ): () => void
}

export interface IWorld {
  createEntity(): EntityId
  destroyEntity(entityId: EntityId): void
  hasEntity(entityId: EntityId): boolean
  setComponent<T>(
    entityId: EntityId,
    componentKey: ComponentKey,
    component: T
  ): void
  removeComponent(entityId: EntityId, componentKey: ComponentKey): void
  getComponent<T>(
    entityId: EntityId,
    componentKey: ComponentKey
  ): T | undefined
  getEntitiesWith(...componentKeys: ComponentKey[]): EntityId[]
  subscribe<Event extends WorldEvent>(
    event: Event,
    handler: (payload: WorldEventPayloads[Event]) => void
  ): () => void
}

export interface ISystem {
  start(): void
  stop(): void
}

export type SystemRegistrationOptions = {
  priority?: number
}
