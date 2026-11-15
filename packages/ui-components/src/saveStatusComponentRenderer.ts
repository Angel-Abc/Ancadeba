import type { SceneComponentData } from '@ancadeba/game-runtime'
import type { ComponentRenderContext, IComponentRenderer } from './componentRendering.js'
import { componentRuntimeText } from './runtimeText.js'

export class SaveStatusComponentRenderer implements IComponentRenderer<
  Extract<SceneComponentData, { type: 'save-status' }>
> {
  render(
    component: Extract<SceneComponentData, { type: 'save-status' }>,
    context: ComponentRenderContext,
  ) {
    const element = context.document.createElement('div')
    element.className = 'ancadeba-save-status'
    element.setAttribute('aria-label', component.label)
    const status = context.document.createElement('span')
    status.setAttribute('role', 'status')
    status.setAttribute('aria-live', 'polite')
    const autosave = context.document.createElement('span')
    autosave.className = 'ancadeba-autosave-status'
    autosave.setAttribute('role', 'status')
    element.append(status, autosave)
    const t = componentRuntimeText(context)

    const update = () => {
      const saves = context.saves
      status.textContent = !saves
        ? t('save.unavailable')
        : saves.readingFile
          ? t('save.reading')
          : saves.error
            ? t(`save.${saves.error}`)
            : saves.status !== 'idle' && saves.status !== 'error'
              ? t(`save.${saves.status}`)
              : ''

      const game =
        context.game ?? (context.scene?.type === 'game' ? context.scene.game.data : undefined)

      autosave.textContent =
        !saves || game?.saving?.autosave === 'disabled'
          ? ''
          : saves.autosaveError
            ? t('save.autosaveError', { error: t(`save.${saves.autosaveError}`) })
            : t(saves.autosaveStatus === 'saved' ? 'save.autosaved' : 'save.autosaveEnabled')
    }

    const unsubscribe = context.saves?.subscribe(update)
    update()

    return {
      element,
      dispose() {
        unsubscribe?.()
        element.remove()
      },
    }
  }
}
