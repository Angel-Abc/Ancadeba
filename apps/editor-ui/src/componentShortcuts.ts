import type { ProjectView } from '@ancadeba/editor-core'
import type { ComponentType } from './componentRegistry.js'
import { componentUnavailable } from './componentRegistry.js'
import type { RuleFormControls } from './ruleFormControls.js'

export type OpenSceneComponent = (
  scene: string,
  type: ComponentType,
  component?: string,
  reference?: string,
) => void

export function componentShortcuts(
  controls: RuleFormControls,
  view: ProjectView,
  scene: ProjectView['scenes'][number],
  types: readonly ComponentType[],
  open: OpenSceneComponent,
  reference?: string,
) {
  const list = controls.create('div')
  list.className = 'component-shortcuts'

  for (const type of types) {
    const name = controls.t(`tree.${type}`)

    for (const component of scene.components) {
      if (component.type !== type) continue

      if (reference && component.type === 'combat' && component.encounter !== reference) continue

      if (
        reference &&
        component.type === 'character-progression' &&
        component.profile !== reference
      )
        continue

      if (
        component.type === 'button' &&
        component.action &&
        component.action.type !== 'request-action'
      )
        continue

      const label =
        'labelKey' in component && component.labelKey
          ? view.translations?.[component.labelKey]
          : undefined

      const button = controls.button(
        [name, label || ('label' in component ? component.label : ''), component.id]
          .filter(Boolean)
          .filter((part, index, parts) => parts.indexOf(part) === index)
          .join(' · '),
        () => open(scene.id, type, component.id),
      )

      button.setAttribute('data-inspector-link', scene.id + '/' + component.id)
      list.append(button)
    }

    const reason = componentUnavailable(type, scene, view)

    const add = controls.button(
      controls.t('inspector.addType', { type: name }),
      () => open(scene.id, type, undefined, reference),
      Boolean(reason),
    )

    add.setAttribute('data-inspector-link', scene.id + '/new/' + type)
    list.append(add)

    if (reason) {
      const help = controls.create('small')
      help.textContent = controls.t(reason)
      list.append(help)
    }
  }

  return list
}
