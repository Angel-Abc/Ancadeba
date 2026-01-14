import { InlineComponent } from '@ancadeba/schemas'
import { ComponentType } from 'react'
import { token } from '@ancadeba/utils'

type ComponentByType<TType extends InlineComponent['type']> = Extract<
  InlineComponent,
  { type: TType }
>

export interface IComponentRegistry {
  register<TType extends InlineComponent['type']>(
    type: TType,
    component: ComponentType<{ component: ComponentByType<TType> }>
  ): void
  resolve<TType extends InlineComponent['type']>(
    type: TType
  ): ComponentType<{ component: ComponentByType<TType> }> | undefined
  has(type: InlineComponent['type']): boolean
}

const logName = 'App/Controls/componentRegistry'
export const componentRegistryToken = token<IComponentRegistry>(logName)

export class ComponentRegistry implements IComponentRegistry {
  private components = new Map<
    InlineComponent['type'],
    ComponentType<{ component: InlineComponent }>
  >()

  register<TType extends InlineComponent['type']>(
    type: TType,
    component: ComponentType<{ component: ComponentByType<TType> }>
  ): void {
    this.components.set(
      type,
      component as ComponentType<{ component: InlineComponent }>
    )
  }

  resolve<TType extends InlineComponent['type']>(
    type: TType
  ): ComponentType<{ component: ComponentByType<TType> }> | undefined {
    return this.components.get(type) as
      | ComponentType<{ component: ComponentByType<TType> }>
      | undefined
  }

  has(type: InlineComponent['type']): boolean {
    return this.components.has(type)
  }
}
