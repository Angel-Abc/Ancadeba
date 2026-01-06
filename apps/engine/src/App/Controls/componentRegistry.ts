import { Component as ComponentData } from '@ancadeba/schemas'
import { ComponentType } from 'react'
import { token } from '@ancadeba/utils'

export interface IComponentRegistry {
  register(
    type: string,
    component: ComponentType<{ component: ComponentData }>
  ): void
  resolve(type: string): ComponentType<{ component: ComponentData }> | undefined
  has(type: string): boolean
}

const logName = 'App/Controls/componentRegistry'
export const componentRegistryToken = token<IComponentRegistry>(logName)

export class ComponentRegistry implements IComponentRegistry {
  private components = new Map<
    string,
    ComponentType<{ component: ComponentData }>
  >()

  register(
    type: string,
    component: ComponentType<{ component: ComponentData }>
  ): void {
    this.components.set(type, component)
  }

  resolve(
    type: string
  ): ComponentType<{ component: ComponentData }> | undefined {
    return this.components.get(type)
  }

  has(type: string): boolean {
    return this.components.has(type)
  }
}
