import type { Translate } from '@ancadeba/utilities'
import type { MapDraft } from './mapDraft.js'
import type { RuleFormControls } from './ruleFormControls.js'
import type { GameRulesDefinition } from '@ancadeba/schemas'
import { mapObjectStatesEditor } from './mapObjectStatesEditor.js'

export interface MapObjectEditorState {
  selected: number
  overrides: Record<string, number>
}

export function mapObjectEditor(
  draft: MapDraft,
  actions: string[],
  controls: RuleFormControls,
  t: Translate,
  change: (operation: () => void) => void,
  state: MapObjectEditorState,
  repaint: () => void,
  spawns: ReadonlySet<string>,
  fields: GameRulesDefinition['state'],
) {
  const element = controls.group(t('maps.objects'))
  const objects = draft.data.objects ?? []
  const object = objects[state.selected]
  let selectedRow: HTMLElement | undefined

  if (object) {
    const row = controls.group(
      object.id,
      controls.input(t('maps.objectId'), object.id, (value) => {
        const previous = object.id
        object.id = value.trim()

        if (previous !== object.id && Object.hasOwn(state.overrides, previous)) {
          state.overrides[object.id] = state.overrides[previous]!
          delete state.overrides[previous]
        }

        repaint()
      }),
      controls.input(t('maps.objectLabel'), object.label, (value) => {
        object.label = value
        repaint()
      }),
      ...(['x', 'y'] as const).map((key) =>
        controls.input(
          t(key === 'x' ? 'maps.objectX' : 'maps.objectY'),
          String(object[key]),
          (value) => {
            object[key] = Number(value)
            repaint()
          },
          'number',
        ),
      ),
      controls.select(
        t('maps.objectAppearance'),
        object.terrain,
        Object.keys(draft.data.terrain),
        (value) => {
          object.terrain = value
          repaint()
        },
      ),
      controls.select(t('maps.objectAction'), object.action, actions, (value) => {
        object.action = value
        repaint()
      }),
      controls.select(
        t('maps.objectBlocking'),
        object.blocking === false ? 'no' : 'yes',
        [
          ['yes', t('maps.yes')],
          ['no', t('maps.no')],
        ],
        (value) => {
          object.blocking = value === 'yes'
          repaint()
        },
      ),
      controls.select(
        t('maps.objectVisible'),
        object.visible === false ? 'no' : 'yes',
        [
          ['yes', t('maps.yes')],
          ['no', t('maps.no')],
        ],
        (value) => {
          object.visible = value === 'yes'
          repaint()
        },
      ),
      controls.button(t('maps.removeObject'), () =>
        change(() => {
          draft.data.objects = objects.filter((entry) => entry !== object)
          state.selected = Math.min(state.selected, objects.length - 2)
        }),
      ),
      mapObjectStatesEditor(
        object,
        Object.keys(draft.data.terrain),
        fields,
        controls,
        change,
        repaint,
        state.overrides,
      ),
    )

    selectedRow = row
    row.classList.add('map-entry-trigger-row')

    for (const field of row.querySelectorAll('input'))
      if (field.type === 'number') {
        field.min = '0'
        field.step = '1'
      }

    element.append(row)
  }

  const available = () => {
    for (let y = 0; y < draft.data.height; y++)
      for (let x = 0; x < draft.data.width; x++)
        if (
          !spawns.has(`${x},${y}`) &&
          !objects.some((entry) => entry.x === x && entry.y === y) &&
          draft.data.terrain[draft.data.tiles[y]![x]!]!.walkable !== false
        )
          return { x, y }

    return undefined
  }

  element.append(
    controls.button(
      t('maps.addObject'),
      () =>
        change(() => {
          const point = available()
          const terrain = Object.keys(draft.data.terrain)[0]

          if (point && actions[0] && terrain)
            state.selected = draft.addObject(
              point,
              actions[0],
              terrain,
              t('maps.objectDefaultLabel'),
            )
        }),
      !actions.length || !available(),
    ),
  )

  if (!actions.length) element.append(t('maps.entryRuleFirst'))

  return {
    element,
    focusSelected: () => selectedRow?.querySelector<HTMLInputElement>('input')?.focus(),
  }
}
