import type { ProjectView } from '@ancadeba/editor-core'
import type {
  InventoryComponentDefinition,
  ItemDetailsComponentDefinition,
  EquipmentComponentDefinition,
} from '@ancadeba/schemas'
import { translationChoices, yesNoChoices, type RuleFormControls } from './ruleFormControls.js'

export function itemViewFields(
  controls: RuleFormControls,
  view: ProjectView,
  scene: ProjectView['scenes'][number],
  draft:
    | InventoryComponentDefinition
    | ItemDetailsComponentDefinition
    | EquipmentComponentDefinition,
  creating: boolean,
  render: () => void,
  hiddenPreviews: InventoryComponentDefinition['previews'],
  includeIdentity = true,
  selection?: { inventoryOwner: string },
) {
  const { t } = controls
  const result: HTMLElement[] = []

  const identity = controls.input(t('items.viewId'), draft.id, (value) => {
    if (creating) draft.id = value.trim()
  })

  identity.querySelector('input')!.readOnly = !creating
  result.push(
    ...(draft.type !== 'inventory'
      ? [
          controls.select(
            t('items.showStats'),
            String(draft.showCombatStats ?? false),
            yesNoChoices(t),
            (value) => {
              draft.showCombatStats = value === 'true'
            },
          ),
        ]
      : []),
    ...(includeIdentity ? [identity] : []),
    controls.input(t('items.viewLabel'), draft.label, (value) => {
      draft.label = value
    }),
    controls.translation(
      t('items.viewLabelTranslation'),
      draft.labelKey ?? '',
      translationChoices(view),
      (value) => {
        draft.labelKey = value || undefined
      },
    ),
    ...(draft.type !== 'inventory'
      ? [
          controls.select(
            t('items.sourceInventory'),
            draft.inventory,
            scene.components.filter((entry) => entry.type === 'inventory').map((entry) => entry.id),
            (value) => {
              draft.inventory = value
              render()
            },
          ),
        ]
      : []),
  )

  if (draft.type === 'item-details')
    result.push(
      controls.select(
        t('items.comparisonEquipment'),
        draft.equipment ?? '',
        [
          '',
          ...scene.components
            .filter((entry) => entry.type === 'equipment' && entry.inventory === draft.inventory)
            .map((entry) => entry.id),
        ],
        (value) => {
          draft.equipment = value || undefined
        },
      ),
      controls.input(t('items.emptyText'), draft.emptyText, (value) => {
        draft.emptyText = value
      }),
      controls.translation(
        t('items.emptyTextTranslation'),
        draft.emptyTextKey ?? '',
        translationChoices(view),
        (value) => {
          draft.emptyTextKey = value || undefined
        },
      ),
    )
  else if (draft.type === 'inventory') {
    const owners = Object.entries(view.inventory?.owners ?? {})

    if (selection && owners.length) {
      if (!owners.some(([id]) => id === selection.inventoryOwner))
        selection.inventoryOwner = owners[0]![0]
      result.push(
        controls.select(
          t('inspector.inventoryOwner'),
          selection.inventoryOwner,
          owners.map(([id, owner]) => [id, owner.label || id] as const),
          (id) => {
            selection.inventoryOwner = id
            render()
          },
          false,
        ),
      )
    }

    result.push(
      ...owners
        .filter(([id]) => !selection || selection.inventoryOwner === id)
        .map(([id, owner]) =>
          controls.select(
            t('items.showOwner', { owner: owner.label }),
            String(draft.owners.includes(id)),
            yesNoChoices(t),
            (value) => {
              draft.owners =
                value === 'true'
                  ? [...new Set([...draft.owners, id])]
                  : draft.owners.filter((owner) => owner !== id)

              if (value === 'false') {
                if (draft.previews[id]) hiddenPreviews[id] = draft.previews[id]
                delete draft.previews[id]
              } else if (hiddenPreviews[id]) {
                draft.previews[id] = hiddenPreviews[id]
                delete hiddenPreviews[id]
              }
            },
          ),
        ),
      controls.select(
        t('items.readOnlyInventory'),
        String(draft.readOnly ?? false),
        yesNoChoices(t),
        (value) => {
          draft.readOnly = value === 'true'
        },
      ),
      controls.select(
        t('items.detailsTarget'),
        draft.descriptionTarget ?? '',
        ['', ...scene.components.filter((value) => value.type === 'text').map((value) => value.id)],
        (value) => {
          draft.descriptionTarget = value || undefined
        },
      ),
    )
  } else {
    const inventory = scene.components.find(
      (entry) => entry.id === draft.inventory && entry.type === 'inventory',
    )

    result.push(
      controls.select(
        t('items.equipmentOwner'),
        draft.owner,
        inventory?.type === 'inventory' ? inventory.owners : [],
        (value) => {
          draft.owner = value
          draft.order = []
          render()
        },
      ),
      controls.input(
        t('items.gridColumns'),
        String(draft.columns),
        (value) => {
          draft.columns = Number(value)
        },
        'number',
      ),
      controls.select(
        t('items.equipmentChanges'),
        String(draft.readOnly),
        [
          ['false', t('items.allowChanges')],
          ['true', t('items.readOnly')],
        ],
        (value) => {
          draft.readOnly = value === 'true'
        },
      ),
      controls.input(t('items.slotOrder'), draft.order.join(', '), (value) => {
        draft.order = value
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      }),
    )
  }

  return result
}
