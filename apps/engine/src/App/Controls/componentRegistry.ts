import { Component as ComponentData } from '@ancadeba/schemas'
import { ComponentType } from 'react'
import { token } from '@ancadeba/utils'

type ComponentByType<TType extends ComponentData['type']> = Extract<
  ComponentData,
  { type: TType }
>

export interface IComponentRegistry {
  register<TType extends ComponentData['type']>(
    type: TType,
    component: ComponentType<{ component: ComponentByType<TType> }>
  ): void
  resolve<TType extends ComponentData['type']>(
    type: TType
  ): ComponentType<{ component: ComponentByType<TType> }> | undefined
  has(type: ComponentData['type']): boolean
}

const logName = 'App/Controls/componentRegistry'
export const componentRegistryToken = token<IComponentRegistry>(logName)

export class ComponentRegistry implements IComponentRegistry {
  private components = new Map<
    ComponentData['type'],
    ComponentType<{ component: ComponentData }>
  >()

  register<TType extends ComponentData['type']>(
    type: TType,
    component: ComponentType<{ component: ComponentByType<TType> }>
  ): void {
    this.components.set(
      type,
      component as ComponentType<{ component: ComponentData }>
    )
  }

  resolve<TType extends ComponentData['type']>(
    type: TType
  ): ComponentType<{ component: ComponentByType<TType> }> | undefined {
    return this.components.get(type) as
      | ComponentType<{ component: ComponentByType<TType> }>
      | undefined
  }

  has(type: ComponentData['type']): boolean {
    return this.components.has(type)
  }
}
