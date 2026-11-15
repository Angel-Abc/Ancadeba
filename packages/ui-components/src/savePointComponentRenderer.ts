import { isAtSavePoint, type SceneComponentData } from '@ancadeba/game-runtime'
import type { ComponentRenderContext, IComponentRenderer } from './componentRendering.js'

export class SavePointComponentRenderer implements IComponentRenderer<
  Extract<SceneComponentData, { type: 'save-point' }>
> {
  render(
    component: Extract<SceneComponentData, { type: 'save-point' }>,
    context: ComponentRenderContext,
  ) {
    const element = context.document.createElement('button')
    element.type = 'button'
    element.className = 'ancadeba-button ancadeba-save-point'
    element.textContent = component.label

    const update = () => {
      element.disabled =
        !context.scene ||
        !isAtSavePoint(context.scene, component) ||
        !context.saves?.canSave ||
        Boolean(component.menuScene && !context.onOpenMenu)
    }

    const onClick = () => {
      update()

      if (element.disabled) return

      if (component.menuScene) context.onOpenMenu?.(component.menuScene)
      else context.saves?.save()
    }

    const unsubscribe = context.saves?.subscribe(update)
    element.addEventListener('click', onClick)
    update()

    return {
      element,
      dispose() {
        unsubscribe?.()
        element.removeEventListener('click', onClick)
        element.remove()
      },
    }
  }
}
