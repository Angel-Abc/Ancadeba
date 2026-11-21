import { resolveCharacterAppearance } from '@ancadeba/game-runtime'
import type { SceneComponentDefinition } from '@ancadeba/schemas'
import type { ComponentRenderContext, RenderedComponent } from './componentRendering.js'
import { GraphicComponentRenderer } from './graphicComponentRenderer.js'

type CharacterView = Extract<SceneComponentDefinition, { type: 'character-view' }>

export class CharacterViewRenderer {
  constructor(private readonly graphics = new GraphicComponentRenderer()) {}

  render(component: CharacterView, context: ComponentRenderContext): RenderedComponent {
    const game =
      context.game ?? (context.scene?.type === 'game' ? context.scene.game.data : undefined)

    const library = context.appearances ?? game?.appearances
    const assets = context.assets ?? game?.assets

    if (!library || !assets)
      throw new Error('Character views require an appearance library and artwork')
    const inventory = context.inventoryDefinition ?? game?.inventory
    const items = context.inventory ?? context.suspendedInventory

    const current = () =>
      resolveCharacterAppearance(
        library,
        component.character,
        component.view,
        assets,
        inventory,
        items?.snapshot ?? Object.values(inventory?.items ?? {}),
      )

    const { visual, appearance, crop } = current()

    const graphic = this.graphics.render(
      { ...component, type: 'graphic', visual, alt: component.label, fit: 'contain', appearance },
      { ...context, assets, bindings: context.bindings ?? context.suspendedBindings },
      crop,
    )

    const unsubscribe = library.characters[component.character]?.owner
      ? items?.subscribeChanges(() => graphic.setAppearance(current().appearance))
      : undefined

    return {
      element: graphic.element,
      dispose() {
        unsubscribe?.()
        graphic.dispose()
      },
    }
  }
}
