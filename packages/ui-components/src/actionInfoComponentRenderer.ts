import type { ActionInfoComponentDefinition } from '@ancadeba/schemas'
import type {
  ComponentRenderContext,
  IComponentRenderer,
  RenderedComponent,
} from './componentRendering.js'
import { componentRuntimeText } from './runtimeText.js'

/** Presents the most recently hovered or keyboard-focused action. */
export class ActionInfoComponentRenderer implements IComponentRenderer<ActionInfoComponentDefinition> {
  render(
    component: ActionInfoComponentDefinition,
    context: ComponentRenderContext,
  ): RenderedComponent {
    const { document, actionInfo } = context
    const t = componentRuntimeText(context)
    const root = document.createElement('section')
    root.className = 'ancadeba-action-info'
    root.setAttribute('aria-label', component.label)
    const heading = document.createElement('h2')
    heading.textContent = component.label
    const content = document.createElement('div')
    content.setAttribute('role', 'status')
    content.setAttribute('aria-live', 'polite')
    content.setAttribute('aria-atomic', 'true')
    const name = document.createElement('h3')
    const description = document.createElement('p')
    const reason = document.createElement('p')
    description.className = 'ancadeba-action-info-description'
    reason.className = 'ancadeba-action-info-reason'
    content.append(name, description, reason)
    root.append(heading, content)

    const update = () => {
      const value = actionInfo?.value
      name.textContent = value?.label ?? ''
      name.hidden = !value
      description.textContent = value ? value.description : component.emptyText
      description.hidden = !description.textContent
      reason.textContent = value?.reason
        ? t('action.unavailableReason', { reason: value.reason })
        : ''
      reason.hidden = !reason.textContent
    }

    update()
    const unsubscribe = actionInfo?.subscribe(update)

    return {
      element: root,
      dispose() {
        unsubscribe?.()
        root.remove()
      },
    }
  }
}
