import type { ButtonComponentData } from '@ancadeba/game-runtime'
import type { ActionBarSlotDefinition } from '@ancadeba/schemas'
import type { ComponentRenderContext } from './componentRendering.js'
import { componentRuntimeText } from './runtimeText.js'

/** Fallback explanations for commands that do not expose a more specific runtime issue. */
export function actionUnavailableReason(
  action: ButtonComponentData['action'] | ActionBarSlotDefinition['action'],
  context: ComponentRenderContext,
): string {
  const t = componentRuntimeText(context)

  if (!action) return t('action.noAction')

  if (action.type === 'move-map') return t('action.movementBlocked')

  if (action.type === 'interact-map') return t('action.noTarget')

  if (action.type === 'request-action' && action.enabledWhen) return t('action.requirements')

  if (
    action.type === 'import-save' ||
    action.type === 'export-save' ||
    action.type === 'save-game' ||
    action.type === 'load-game' ||
    action.type === 'load-autosave' ||
    action.type === 'delete-save'
  )
    return t('save.unavailable')

  if (action.type === 'shop-action' && context.scene?.type === 'game') {
    const scene = context.scene
    const issue = scene.game.trading?.checkTrade(scene, action.shop, action.operation)

    const definition = (
      context.localization?.current.scenes.get(scene.data.id) ?? scene.data
    ).components.find((component) => component.type === 'shop' && component.id === action.shop)

    if (issue && definition?.type === 'shop') return definition.messages[issue]
  }

  return t('action.unavailable')
}
