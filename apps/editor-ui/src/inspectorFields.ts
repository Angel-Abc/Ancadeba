import { type ProjectView } from '@ancadeba/editor-core'
import {
  graphicAppearanceSchema,
  type SceneComponentDefinition,
  type InventoryComponentDefinition,
} from '@ancadeba/schemas'
import type { RenderedGraphic } from '@ancadeba/ui-components'
import { z } from 'zod'
import { basicComponentFields } from './basicComponentFields.js'
import { actionBarForm } from './actionBarForm.js'
import { graphicAppearanceForm } from './graphicAppearanceForm.js'
import { itemViewFields } from './itemViewFields.js'
import { nearbyFields } from './nearbyFields.js'
import { shopForm } from './shopForm.js'
import { statusPanelForm } from './statusPanelForm.js'
import { isBasicComponent } from './componentRegistry.js'
import { translationChoices, type RuleFormControls } from './ruleFormControls.js'
import { sceneGraphicPreview, type SceneGraphicPreviewFactory } from './sceneGraphicEditor.js'
import type { TextBindingPending } from './textBindingsForm.js'

export const inspectorSelectionSchema = z.object({
  selected: z.string().default(''),
  newTarget: z.string().default(''),
  newAction: z.string().default(''),
  slot: z.string().default('1'),
  row: z.string().default(''),
  effect: z.string().default(''),
  startingValues: z.boolean().default(false),
  price: z.string().default(''),
  message: z.string().default(''),
  action: z.string().default(''),
  binding: z.string().default(''),
  graphicSlot: z.string().default(''),
  graphicColor: z.string().default(''),
  inventoryOwner: z.string().default(''),
})

export type InspectorSelection = z.infer<typeof inspectorSelectionSchema>

export type Specialist =
  | 'combat'
  | 'leveling'
  | 'asset'
  | 'localization'
  | 'maps'
  | 'component'
  | 'form-library'
  | 'character-profile'

export type OpenSpecialist = (kind: Specialist, id: string) => void

interface FieldContext {
  controls: RuleFormControls
  view: ProjectView
  scene: ProjectView['scenes'][number]
  draft: SceneComponentDefinition
  selection: InspectorSelection
  creating: boolean
  error: HTMLElement
  bindingPending: TextBindingPending
  panels: InventoryComponentDefinition[]
  hiddenPreviews: InventoryComponentDefinition['previews']
  render: () => void
  open: OpenSpecialist
  createPreview?: SceneGraphicPreviewFactory | undefined
  replacePreview: (preview: RenderedGraphic | undefined) => void
}

export function inspectorFields(context: FieldContext) {
  const { controls, view, scene, draft, selection, render, open } = context
  const { t, select, button } = controls

  const change = (edit: () => void) => {
    edit()
    controls.markEdited()
    render()
  }

  const link = (kind: Specialist, id: string, key: string) => {
    const control = button(t(key), () => open(kind, id), !id || context.creating)
    control.setAttribute('data-inspector-link', kind + '/' + id)

    return control
  }

  const main: HTMLElement[] = []
  const behavior: HTMLElement[] = []
  const layout: HTMLElement[] = []

  if (isBasicComponent(draft)) {
    if (draft.type === 'character-sheet') {
      main.push(
        controls.input(t('form.label'), draft.label, (value) => {
          draft.label = value
        }),
        controls.translation(
          t('form.labelTranslation'),
          draft.labelKey ?? '',
          translationChoices(view),
          (value) => {
            draft.labelKey = value || undefined
          },
        ),
        ...statusPanelForm(controls, view, draft, render, true, selection),
      )
    } else {
      basicComponentFields(
        controls,
        view,
        scene.id,
        draft,
        render,
        context.bindingPending,
        selection,
        { main, behavior, layout },
        (id) => link('asset', id, 'inspector.openAsset'),
        (id) => link('maps', id, 'inspector.openMap'),
      )
    }

    if (draft.type === 'form') main.push(link('form-library', draft.form, 'forms.open'))

    if (draft.type === 'character-sheet')
      main.push(link('character-profile', 'character-profile', 'inspector.openCharacterProfile'))
  } else
    switch (draft.type) {
      case 'nearby':
        main.push(nearbyFields(controls, view, scene, draft, selection, render, context.error))
        break
      case 'action-bar':
        main.push(
          ...actionBarForm(
            controls,
            view,
            draft,
            selection.slot,
            (id) => {
              selection.slot = id
              render()
            },
            change,
            scene.id,
            true,
          ),
        )
        break
      case 'status-panel':
        main.push(...statusPanelForm(controls, view, draft, render, true, selection))
        break
      case 'inventory':
      case 'item-details':
      case 'equipment': {
        const fields = itemViewFields(
          controls,
          view,
          scene,
          draft,
          context.creating,
          render,
          context.hiddenPreviews,
          false,
          selection,
        )

        if (draft.type === 'inventory') main.push(...fields.splice(0, 2))
        else {
          behavior.push(fields.shift()!)
          main.push(...fields.splice(0, 3))
          main.push(link('component', draft.inventory, 'inspector.openInventory'))
        }

        behavior.push(...fields)
        break
      }

      case 'combat':
      case 'character-progression': {
        const combat = draft.type === 'combat'

        const refs = combat
          ? Object.keys(view.combatSources ?? {})
          : Object.keys(view.leveling ?? {})

        const current = combat ? draft.encounter : draft.profile
        main.push(
          select(t(combat ? 'combat.encounter' : 'inspector.profile'), current, refs, (id) =>
            change(() => {
              if (draft.type === 'combat') draft.encounter = id
              else draft.profile = id
            }),
          ),
          link(
            combat ? 'combat' : 'leveling',
            current,
            combat ? 'inspector.openEncounter' : 'inspector.openProfile',
          ),
        )
        behavior.push(
          select(
            t('component.mainTextTarget'),
            draft.textTarget ?? '',
            [
              '',
              ...scene.components.filter((entry) => entry.type === 'text').map((entry) => entry.id),
            ],
            (id) => {
              draft.textTarget = id || undefined
            },
          ),
        )

        if (draft.type === 'combat')
          behavior.push(
            select(
              t('combat.lootInventory'),
              draft.lootInventory ?? '',
              [
                '',
                ...scene.components
                  .filter((entry) => entry.type === 'inventory')
                  .map((entry) => entry.id),
              ],
              (id) => {
                draft.lootInventory = id || undefined
              },
            ),
          )
        break
      }

      case 'shop': {
        const summary = controls.create('p')

        const describePanels = () => {
          const updates = context.panels.filter((panel) =>
            scene.components.some((entry) => entry.id === panel.id),
          )

          const additions = context.panels.filter((panel) => !updates.includes(panel))
          summary.textContent = [
            additions.length
              ? t('inspector.shopCreates', {
                  panels: additions.map((panel) => panel.id).join(', '),
                })
              : '',
            updates.length
              ? t('inspector.shopUpdates', { panels: updates.map((panel) => panel.id).join(', ') })
              : '',
          ]
            .filter(Boolean)
            .join(' ')
        }

        const fields = shopForm(
          controls,
          view,
          scene.id,
          draft,
          context.creating ? context.panels : undefined,
          render,
          true,
          selection,
          describePanels,
        )

        main.push(...fields.splice(0, 4))

        if (context.creating) {
          describePanels()
          main.push(summary)
        }

        behavior.push(...fields)
        break
      }

      case 'graphic': {
        const assets = view.assets

        const visuals = [assets?.images, assets?.parts, assets?.compositions].flatMap((items) =>
          Object.keys(items ?? {}),
        )

        const preview = controls.create('div')
        preview.className = 'scene-graphic-preview'
        preview.setAttribute('aria-label', t('graphic.previewLabel'))

        const status = controls.create('p')
        status.setAttribute('role', 'status')

        const refresh = () => {
          try {
            const result = sceneGraphicPreview(draft, view, selection.startingValues, t)
            status.textContent = result.status

            const rendered = context.createPreview?.(
              result.component,
              view,
              selection.startingValues,
            )

            context.replacePreview(rendered)
            preview.replaceChildren(...(rendered ? [rendered.element] : []))
          } catch (reason) {
            context.replacePreview(undefined)
            preview.replaceChildren()
            status.textContent = reason instanceof Error ? reason.message : String(reason)
          }
        }

        main.push(
          select(t('graphic.visual'), draft.visual, visuals, (value) =>
            change(() => {
              draft.visual = value
              draft.appearance = graphicAppearanceSchema.parse({})
            }),
          ),
          link('asset', draft.visual, 'inspector.openAsset'),
          preview,
          status,
          select(
            t('graphic.previewValues'),
            selection.startingValues ? 'starting' : 'static',
            [
              ['static', t('graphic.staticValues')],
              ['starting', t('graphic.startingValues')],
            ],
            (value) => {
              selection.startingValues = value === 'starting'
              refresh()
            },
            false,
          ),
          controls.input(t('graphic.alt'), draft.alt, (value) => {
            draft.alt = value
          }),
          controls.translation(
            t('graphic.altTranslation'),
            draft.altKey ?? '',
            translationChoices(view),
            (value) => {
              draft.altKey = value || undefined
            },
          ),
        )
        refresh()

        if (assets)
          behavior.push(
            graphicAppearanceForm(
              controls,
              view,
              assets,
              draft.visual,
              draft.appearance,
              scene.type === 'game',
              change,
              () => {
                controls.markEdited()
                refresh()
              },
              selection,
              render,
            ),
          )
        layout.push(
          select(
            t('graphic.fit'),
            draft.fit,
            [
              ['contain', t('assets.contain')],
              ['cover', t('assets.cover')],
            ],
            (value) => {
              draft.fit = value
              refresh()
            },
          ),
        )
        break
      }
    }

  return { main, behavior, layout }
}
