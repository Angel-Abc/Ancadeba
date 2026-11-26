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
  editRoute: () => void,
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

        for (const entry of objects) {
          const approach = entry.patrol?.approach

          if (approach?.guard === previous) approach.guard = object.id
        }

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

            if (object.patrol) object.patrol.route[0]![key] = object[key]
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
          for (const entry of objects) {
            if (entry.patrol?.approach?.guard === object.id) delete entry.patrol.approach
          }

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

    const patrol = object.patrol
    const trigger = patrol?.trigger

    const movement = controls.group(
      t('maps.patrol'),
      controls.select(
        t('maps.patrolTrigger'),
        trigger?.type ?? 'none',
        [
          ['none', t('maps.noPatrol')],
          ['timer', t('maps.timerPatrol')],
          ['player-step', t('maps.stepPatrol')],
          ['player-turn', t('maps.turnPatrol')],
        ] as const,
        (type) =>
          change(() => {
            if (type === 'none') {
              delete object.patrol

              return
            }

            const next = type === 'timer' ? { type, intervalMs: 1000 } : { type }

            if (patrol) patrol.trigger = next
            else
              object.patrol = {
                trigger: next,
                mode: 'reverse',
                route: [{ x: object.x, y: object.y }],
              }
          }),
      ),
    )

    if (patrol) {
      movement.append(
        controls.select(
          t('maps.patrolMode'),
          patrol.mode,
          [
            ['loop', t('maps.loopPatrol')],
            ['reverse', t('maps.reversePatrol')],
            ['one-way', t('maps.oneWayPatrol')],
          ],
          (mode) =>
            change(() => {
              patrol.mode = mode

              if (mode !== 'one-way') {
                delete patrol.approach
                delete patrol.returnDelayMs
              }
            }),
        ),
      )

      if (patrol.mode === 'one-way') {
        const guards = objects.filter(
          (entry) =>
            entry !== object &&
            !entry.patrol &&
            !objects.some(
              (other) => other !== object && other.patrol?.approach?.guard === entry.id,
            ),
        )

        movement.append(
          controls.input(
            t('maps.returnDelay'),
            patrol.returnDelayMs === undefined ? '' : String(patrol.returnDelayMs / 1000),
            (value) => {
              if (value === '') delete patrol.returnDelayMs
              else patrol.returnDelayMs = Math.round(Number(value) * 1000)
            },
            'number',
          ),
          controls.select(
            t('maps.approachGuard'),
            patrol.approach?.guard ?? '',
            [
              ['', t('maps.noGuard')] as const,
              ...guards.map((entry) => [entry.id, entry.label] as const),
            ],
            (id) =>
              change(() => {
                if (id) patrol.approach = { radius: 2, ...patrol.approach, guard: id }
                else delete patrol.approach
              }),
          ),
        )
        const approach = patrol.approach

        if (approach) {
          const radius = controls.input(
            t('maps.approachRadius'),
            String(approach.radius),
            (value) => {
              approach.radius = Number(value)
            },
            'number',
          )

          radius.querySelector('input')!.min = '1'
          radius.querySelector('input')!.step = '1'
          movement.append(
            radius,
            controls.select(
              t('maps.onWarnedApproach'),
              approach.onWarnedApproach ?? '',
              [['', t('rules.noAction')], ...actions.map((id) => [id, id] as const)],
              (id) => {
                if (id) approach.onWarnedApproach = id
                else delete approach.onWarnedApproach
              },
            ),
          )
        }
      }

      if (trigger?.type === 'timer') {
        const interval = controls.input(
          t('maps.patrolSeconds'),
          String(trigger.intervalMs / 1000),
          (value) => {
            trigger.intervalMs = Math.round(Number(value) * 1000)
          },
          'number',
        )

        movement.append(interval)
      }

      const route = controls.create('p')
      route.textContent = patrol.route
        .map((point) => '(' + point.x + ', ' + point.y + ')')
        .join(' → ')
      movement.append(
        route,
        controls.button(t('maps.drawRoute'), editRoute),
        controls.button(
          t('maps.undoTile'),
          () =>
            change(() => {
              patrol.route.pop()
            }),
          patrol.route.length <= 1,
        ),
      )
    }

    row.append(movement)
    selectedRow = row
    row.classList.add('map-entry-trigger-row')

    for (const field of row.querySelectorAll('input'))
      if (field.type === 'number') {
        if (field.min === '1') continue
        field.min = movement.contains(field) ? '0.001' : '0'
        field.step = movement.contains(field) ? '0.001' : '1'
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
