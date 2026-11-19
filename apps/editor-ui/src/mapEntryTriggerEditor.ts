import { getMapMovementCostMs } from '@ancadeba/schemas'
import type { Translate } from '@ancadeba/utilities'
import type { RuleFormControls } from './ruleFormControls.js'
import type { MapDraft } from './mapDraft.js'

export interface MapEntryTriggerEditorState {
  selected: number
}

export function mapEntryTriggerEditor(
  draft: MapDraft,
  actions: readonly string[],
  controls: RuleFormControls,
  t: Translate,
  change: (operation: () => void) => void,
  state: MapEntryTriggerEditorState,
  repaint: () => void,
) {
  const map = draft.data
  const element = controls.group(t('maps.entryTriggers'))
  const triggers = map.entryTriggers ?? []
  const trigger = triggers[state.selected]
  let selectedRow: HTMLElement | undefined

  if (trigger) {
    const row = controls.group(
      trigger.id,
      controls.input(t('maps.entryId'), trigger.id, (value) => {
        trigger.id = value.trim()
        repaint()
      }),
      controls.input(
        t('maps.entryX'),
        String(trigger.x),
        (value) => {
          trigger.x = Number(value)
          repaint()
        },
        'number',
      ),
      controls.input(
        t('maps.entryY'),
        String(trigger.y),
        (value) => {
          trigger.y = Number(value)
          repaint()
        },
        'number',
      ),
      controls.select(t('maps.entryAction'), trigger.action, actions, (value) => {
        trigger.action = value
        repaint()
      }),
      controls.button(t('maps.removeEntryTrigger'), () =>
        change(() => {
          map.entryTriggers = triggers.filter((entry) => entry !== trigger)
          state.selected = Math.min(state.selected, triggers.length - 2)
        }),
      ),
    )

    selectedRow = row
    row.classList.add('map-entry-trigger-row')

    for (const input of row.querySelectorAll('input')) {
      if (input.type !== 'number') continue
      input.min = '0'
      input.step = '1'
    }

    element.append(row)
  }

  const availableTile = () => {
    const occupied = new Set(triggers.map(({ x, y }) => `${x},${y}`))

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (getMapMovementCostMs(map, { x, y }) !== undefined && !occupied.has(`${x},${y}`))
          return { x, y }
      }
    }

    return undefined
  }

  element.append(
    controls.button(
      t('maps.addEntryTrigger'),
      () =>
        change(() => {
          const available = availableTile()

          if (!available || !actions[0]) return
          state.selected = draft.addEntryTrigger(available, actions[0])
        }),
      !availableTile() || actions.length === 0,
    ),
  )

  if (!actions.length) {
    const hint = controls.create('p')
    hint.className = 'help'
    hint.textContent = t('maps.entryRuleFirst')
    element.append(hint)
  }

  return {
    element,
    focusSelected: () => selectedRow?.querySelector<HTMLInputElement>('input')?.focus(),
  }
}
