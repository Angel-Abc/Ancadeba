import {
  ruleStateType,
  type GameRulesDefinition,
  type RuleBranch,
  type RuleCondition,
  type RuleEffect,
  type RuleText,
} from '@ancadeba/schemas'
import { entryEditor, fieldPath, type EntrySelections } from './specialistEntries.js'
import type { ProjectView } from '@ancadeba/editor-core'
import { sceneEntranceFields } from './sceneEntranceFields.js'
import {
  parseStatePath,
  type RuleFormControls,
  ruleValueControls,
  statePath,
  translationChoices,
} from './ruleFormControls.js'
import {
  combatOutcomeLabels,
  comparisonLabels,
  conditionTypeLabels,
  effectTypeLabels,
  labelled,
  questChoices,
  questStatusLabels,
  sceneChoices,
} from './choiceLabels.js'

type ConditionType = RuleCondition['type']

type EffectType = RuleEffect['type']

export function rulesDefinitionForm(
  controls: RuleFormControls,
  view: ProjectView,
  rules: GameRulesDefinition,
  selected: string,
  selectAction: (id: string) => void,
  change: (edit: () => void) => void,
  rerender: () => void,
  otherFields: GameRulesDefinition['state'],
  entries: EntrySelections,
): HTMLElement[] {
  const { button, create, group, input, select, t } = controls
  const keys = translationChoices(view, false)
  const scenes = view.scenes.filter(({ type }) => type === 'game')
  const sceneIds = scenes.map(({ id }) => id)
  const owners = Object.keys(view.inventory?.owners ?? {})
  const items = Object.keys(view.inventory?.items ?? {})

  const targets = [
    ...new Set([
      ...view.scenes.flatMap((scene) =>
        scene.components.flatMap((component) =>
          component.type === 'nearby' ? Object.keys(component.entries) : [],
        ),
      ),
      ...Object.values(view.maps ?? {}).flatMap((map) => map.objects?.map(({ id }) => id) ?? []),
    ]),
  ]

  const availableFields = [...rules.state, ...otherFields]
  const fields = availableFields.map(({ path }) => statePath(path))
  const firstPath = () => availableFields[0]?.path.slice() ?? ['']
  const firstValue = () => (availableFields[0] ? defaultValue(availableFields[0]) : '')

  const text = (title: string, value: RuleText, update: (value: RuleText) => void) =>
    ruleValueControls(
      controls,
      title,
      value,
      keys,
      (next) => {
        if (typeof next === 'string' || typeof next === 'object') update(next)
      },
      rerender,
      ['text', 'translation'],
    )

  function defaultValue(
    field: GameRulesDefinition['state'][number] | undefined,
  ): string | number | boolean {
    if (!field) return ''

    if (field.value === undefined) return 0

    return typeof field.value === 'object' ? '' : field.value
  }

  function condition(type: ConditionType): RuleCondition {
    switch (type) {
      case 'scene-is':
        return { type, scene: sceneIds[0] ?? '' }
      case 'state-is':
        return { type, path: firstPath(), value: firstValue() }
      case 'state-compare':
        return { type, path: firstPath(), operator: 'gte', value: 1 }
      case 'quest-state':
        return { type, quest: Object.keys(view.quests ?? {})[0] ?? '', status: 'completed' }
      case 'combat-outcome':
        return { type, encounter: Object.keys(view.combat ?? {})[0] ?? '', outcome: 'victory' }
      case 'item-owned-by':
      case 'item-carried-by':
        return { type, item: items[0] ?? '', owner: owners[0] ?? '' }
      case 'payload-is-item':
        return { type, item: items[0] ?? '' }
      case 'payload-is-target':
        return {
          type,
          target: targets[0] ?? '',
        }
    }
  }

  function effect(type: EffectType): RuleEffect {
    switch (type) {
      case 'set-state':
        return { type, path: firstPath(), value: firstValue() }
      case 'move-item':
        return { type, item: items[0] ?? '', owner: owners[0] ?? '' }
      case 'collect-items':
        return { type, items: items.length ? [items[0]!] : [], owner: owners[0] ?? '' }
      case 'enter-scene':
        return { type, scene: sceneIds[0] ?? '' }
      case 'start-quest':
      case 'complete-quest':
        return { type, quest: Object.keys(view.quests ?? {})[0] ?? '' }
      case 'append-log':
        return { type, text: '' }
    }
  }

  function stateField(
    entry: Extract<RuleCondition | RuleEffect, { type: 'state-is' | 'set-state' }>,
  ) {
    const field = availableFields.find(({ path }) => statePath(path) === statePath(entry.path))
    const type = field && ruleStateType(field)

    const types =
      type === 'string'
        ? entry.type === 'set-state'
          ? ['text', 'translation']
          : ['text']
        : type
          ? [type]
          : undefined

    return [
      select(t('form.stateField'), statePath(entry.path), fields, (next) => {
        entry.path = parseStatePath(next)
        entry.value = defaultValue(availableFields.find(({ path }) => statePath(path) === next))
        rerender()
      }),
      ...ruleValueControls(
        controls,
        t('form.value'),
        entry.value,
        keys,
        (next) => {
          if (entry.type === 'set-state') entry.value = next
          else if (typeof next !== 'object') entry.value = next
        },
        rerender,
        types,
      ),
    ]
  }

  function describeCondition(condition: RuleCondition) {
    const label = t(conditionTypeLabels.get(condition.type)!)

    switch (condition.type) {
      case 'scene-is':
        return label + ' · ' + condition.scene
      case 'state-is':
        return statePath(condition.path) + ' = ' + String(condition.value)
      case 'state-compare':
        return [
          statePath(condition.path),
          t(comparisonLabels.get(condition.operator)!),
          condition.value,
        ].join(' ')
      case 'quest-state':
        return [condition.quest, t(questStatusLabels.get(condition.status)!), condition.stage]
          .filter(Boolean)
          .join(' · ')
      case 'combat-outcome':
        return condition.encounter + ' · ' + t(combatOutcomeLabels.get(condition.outcome)!)
      case 'item-owned-by':
      case 'item-carried-by':
        return [label, condition.item, condition.owner].join(' · ')
      case 'payload-is-target':
        return label + ' · ' + condition.target
      case 'payload-is-item':
        return label + ' · ' + condition.item
    }
  }

  const state = group(
    t('rules.initialState'),
    ...rules.state.map((field, index) =>
      group(
        t('rules.field', { number: index + 1 }),
        fieldPath(
          input(t('rules.bindingPathDotted'), statePath(field.path), (next) => {
            field.path = parseStatePath(next)
          }),
          'state',
          index,
          'path',
        ),
        ...('type' in field
          ? [
              input(
                t('character.statInitialValue'),
                field.value === undefined ? '' : String(field.value),
                (value) => {
                  field.value = value === '' ? undefined : Number(value)
                },
                'number',
              ),
            ]
          : ruleValueControls(
              controls,
              t('rules.initialValue'),
              field.value,
              keys,
              (next) => {
                field.value = next
              },
              rerender,
            )),
        button(t('rules.removeField'), () =>
          change(() => {
            rules.state.splice(index, 1)
          }),
        ),
      ),
    ),
    button(t('character.addStat'), () =>
      change(() => {
        rules.state.push({ path: [''], type: 'number' })
      }),
    ),
    button(t('rules.addField'), () =>
      change(() => {
        rules.state.push({ path: [''], value: '' })
      }),
    ),
  )

  const clock = rules.clock
  const log = rules.log

  const display = group(
    t('rules.clockAndLog'),
    clock
      ? group(
          t('rules.clock'),
          fieldPath(
            input(t('form.bindingPath'), statePath(clock.path), (next) => {
              clock.path = parseStatePath(next)
            }),
            'clock',
            'path',
          ),
          fieldPath(
            input(
              t('rules.startTime'),
              `${String(Math.floor(clock.startMinute / 60)).padStart(2, '0')}:${String(clock.startMinute % 60).padStart(2, '0')}`,
              (next) => {
                const [hours, minutes] = next.split(':').map(Number)
                clock.startMinute = hours! * 60 + minutes!
              },
              'time',
            ),
            'clock',
            'startMinute',
          ),
          button(t('rules.removeClock'), () =>
            change(() => {
              delete rules.clock
            }),
          ),
        )
      : button(t('rules.addClock'), () =>
          change(() => {
            rules.clock = { path: ['clock'], startMinute: 540 }
          }),
        ),
    log
      ? group(
          t('rules.log'),
          fieldPath(
            input(t('form.bindingPath'), statePath(log.path), (next) => {
              log.path = parseStatePath(next)
            }),
            'log',
            'path',
          ),
          fieldPath(
            input(
              t('rules.maxEntries'),
              String(log.capacity),
              (next) => {
                log.capacity = Number(next)
              },
              'number',
            ),
            'log',
            'capacity',
          ),
          ...log.initial.map((value, index) =>
            group(
              t('rules.initialEntry', { number: index + 1 }),
              ...text(t('rules.message'), value, (next) => {
                log.initial[index] = next
              }),
              button(t('rules.removeEntry'), () =>
                change(() => {
                  log.initial.splice(index, 1)
                }),
              ),
            ),
          ),
          button(t('rules.addInitialEntry'), () =>
            change(() => {
              log.initial.push('')
            }),
          ),
          button(t('rules.removeLog'), () =>
            change(() => {
              delete rules.log
            }),
          ),
        )
      : button(t('rules.addLog'), () =>
          change(() => {
            rules.log = { path: ['log'], capacity: 8, initial: [] }
          }),
        ),
  )

  const actions = group(t('rules.actions'))
  const actionIds = Object.keys(rules.actions)

  if (actionIds.length)
    actions.append(select(t('form.action'), selected, actionIds, selectAction, false))
  const newId = create('input')
  newId.setAttribute('aria-label', t('rules.newActionId'))
  newId.placeholder = t('rules.newActionId')
  newId.addEventListener('input', controls.markEdited)

  const addAction = button(t('rules.addAction'), () => {
    const id = newId.value.trim()

    if (!/^[a-zA-Z0-9_-]+$/.test(id) || Object.hasOwn(rules.actions, id)) {
      newId.setCustomValidity(t('rules.invalidActionId'))
      newId.reportValidity()

      return
    }

    change(() => {
      Object.defineProperty(rules.actions, id, {
        value: [{ when: [], effects: [] }],
        writable: true,
        enumerable: true,
        configurable: true,
      })
      selectAction(id)
    })
  })

  newId.addEventListener('input', () => newId.setCustomValidity(''))

  const add = controls.fold(
    'new-action',
    t('specialist.newAction'),
    !actionIds.length,
    newId,
    addAction,
  )

  const branches = Object.hasOwn(rules.actions, selected) ? rules.actions[selected] : undefined

  if (branches) {
    const branchKey = 'branches/' + selected

    const branchTitle = (branch: RuleBranch, index: number) => {
      const first = branch.when[0]
      const summary = first ? describeCondition(first) : t('form.always')
      const more = branch.when.length > 1 ? ' (+' + (branch.when.length - 1) + ')' : ''

      return t('rules.branch', { number: index + 1 }) + ' · ' + summary + more
    }

    const branchFields = (branch: RuleBranch, index: number) => {
      const row = group(
        t('rules.branch', { number: index + 1 }),
        button(
          t('rules.moveUp'),
          () =>
            change(() => {
              entries[branchKey] = index - 1
              branches.splice(index - 1, 0, branches.splice(index, 1)[0]!)
            }),
          index === 0,
        ),
        button(
          t('rules.moveDown'),
          () =>
            change(() => {
              entries[branchKey] = index + 1
              branches.splice(index + 1, 0, branches.splice(index, 1)[0]!)
            }),
          index === branches.length - 1,
        ),
        button(
          t('rules.removeBranch'),
          () =>
            change(() => {
              branches.splice(index, 1)
            }),
          branches.length === 1,
        ),
      )

      const conditions = group(t('rules.whenAll'))
      branch.when.forEach((entry, position) => {
        const field = group(
          t('form.conditionNumber', { number: position + 1 }),
          select(
            t('rules.condition'),
            entry.type,
            labelled(
              [
                'scene-is',
                'state-is',
                'state-compare',
                'quest-state',
                'combat-outcome',
                'item-owned-by',
                'item-carried-by',
                'payload-is-item',
                'payload-is-target',
              ] as const,
              conditionTypeLabels,
              t,
            ),
            (next) =>
              change(() => {
                branch.when[position] = condition(next)
              }),
          ),
        )

        if (entry.type === 'scene-is')
          field.append(
            select(t('scene.label'), entry.scene, sceneChoices(view, 'game'), (next) => {
              entry.scene = next
            }),
          )

        if (entry.type === 'state-is') field.append(...stateField(entry))

        if (entry.type === 'state-compare')
          field.append(
            select(t('form.stateField'), statePath(entry.path), fields, (value) => {
              entry.path = parseStatePath(value)
            }),
            select(
              t('form.comparison'),
              entry.operator,
              labelled(['eq', 'gte', 'lte', 'gt', 'lt'] as const, comparisonLabels, t),
              (value) => {
                entry.operator = value
              },
            ),
            input(
              t('form.requiredAmount'),
              String(entry.value),
              (value) => {
                entry.value = Number(value)
              },
              'number',
            ),
          )

        if (entry.type === 'quest-state')
          field.append(
            select(t('form.quest'), entry.quest, questChoices(view), (value) => {
              entry.quest = value
            }),
            select(
              t('form.questStatus'),
              entry.status,
              labelled(
                ['not-started', 'active', 'ready', 'completed'] as const,
                questStatusLabels,
                t,
              ),
              (value) => {
                entry.status = value
              },
            ),
            input(t('form.optionalStageId'), entry.stage ?? '', (value) => {
              entry.stage = value || undefined
            }),
          )

        if (entry.type === 'combat-outcome')
          field.append(
            select(
              t('form.encounter'),
              entry.encounter,
              Object.keys(view.combat ?? {}),
              (value) => {
                entry.encounter = value
              },
            ),
            select(
              t('form.outcome'),
              entry.outcome,
              labelled(['victory', 'defeat', 'escaped'] as const, combatOutcomeLabels, t),
              (value) => {
                entry.outcome = value
              },
            ),
          )

        if (entry.type === 'payload-is-target')
          field.append(
            select(t('rules.target'), entry.target, targets, (next) => {
              entry.target = next
            }),
          )

        if ('item' in entry)
          field.append(
            select(t('rules.item'), entry.item, items, (next) => {
              entry.item = next
            }),
          )

        if ('owner' in entry)
          field.append(
            select(t('rules.owner'), entry.owner, owners, (next) => {
              entry.owner = next
            }),
          )
        field.append(
          button(t('form.removeCondition'), () =>
            change(() => {
              branch.when.splice(position, 1)
            }),
          ),
        )
        conditions.append(fieldPath(field, 'actions', selected, index, 'when', position))
      })
      conditions.append(
        button(t('form.addCondition'), () =>
          change(() => {
            branch.when.push(condition('scene-is'))
          }),
        ),
      )

      const effects = group(t('rules.effects'))
      branch.effects.forEach((entry, position) => {
        const field = group(
          t('form.effectNumber', { number: position + 1 }),
          select(
            t('rules.effect'),
            entry.type,
            labelled(
              [
                'set-state',
                'move-item',
                'collect-items',
                'enter-scene',
                'append-log',
                'start-quest',
                'complete-quest',
              ] as const,
              effectTypeLabels,
              t,
            ),
            (next) =>
              change(() => {
                branch.effects[position] = effect(next)
              }),
          ),
        )

        if (entry.type === 'set-state') field.append(...stateField(entry))

        if (entry.type === 'start-quest' || entry.type === 'complete-quest')
          field.append(
            select(t('form.quest'), entry.quest, questChoices(view), (value) => {
              entry.quest = value
            }),
          )

        if (entry.type === 'move-item')
          field.append(
            select(t('rules.item'), entry.item, items, (next) => {
              entry.item = next
            }),
            select(t('rules.destinationOwner'), entry.owner, owners, (next) => {
              entry.owner = next
            }),
          )

        if (entry.type === 'collect-items') {
          const help = create('p')
          help.className = 'help'
          help.textContent = t('rules.pickupHelp')
          field.append(
            help,
            select(t('rules.destinationOwner'), entry.owner, owners, (next) => {
              entry.owner = next
            }),
            ...entry.items.map((item, index) =>
              group(
                t('rules.pickupItem', { number: index + 1 }),
                select(t('rules.item'), item, items, (next) => {
                  entry.items[index] = next
                }),
                button(
                  t('rules.removePickupItem'),
                  () =>
                    change(() => {
                      entry.items.splice(index, 1)
                    }),
                  entry.items.length === 1,
                ),
              ),
            ),
            button(
              t('rules.addPickupItem'),
              () =>
                change(() => {
                  const item = items.find((id) => !entry.items.includes(id))

                  if (item) entry.items.push(item)
                }),
              !items.some((id) => !entry.items.includes(id)) || entry.items.length >= 100,
            ),
          )
        }

        if (entry.type === 'enter-scene') {
          field.append(
            select(t('rules.destinationScene'), entry.scene, sceneChoices(view, 'game'), (next) => {
              entry.scene = next
              delete entry.mapView
              delete entry.position
              rerender()
            }),
            ...sceneEntranceFields(controls, view, entry, rerender, true),
          )
        }

        if (entry.type === 'append-log')
          field.append(
            ...text(t('rules.message'), entry.text, (next) => {
              entry.text = next
            }),
          )
        field.append(
          button(t('form.removeEffect'), () =>
            change(() => {
              branch.effects.splice(position, 1)
            }),
          ),
        )
        effects.append(fieldPath(field, 'actions', selected, index, 'effects', position))
      })
      effects.append(
        button(t('form.addEffect'), () =>
          change(() => {
            branch.effects.push(effect('set-state'))
          }),
        ),
      )
      row.append(conditions, effects)

      return fieldPath(row, 'actions', selected, index)
    }

    actions.append(
      entryEditor(
        controls,
        entries,
        branchKey,
        t('specialist.branches'),
        branches,
        branchTitle,
        branchFields,
        { path: ['actions', selected] },
      ),
    )
    actions.append(
      button(t('rules.addBranch'), () =>
        change(() => {
          entries[branchKey] = branches.length
          branches.push({ when: [], effects: [] })
        }),
      ),
      button(t('rules.removeAction'), () =>
        change(() => {
          delete rules.actions[selected]
          selectAction(Object.keys(rules.actions)[0] ?? '')
        }),
      ),
    )
  }

  actions.append(add)

  return [fieldPath(actions, 'actions'), fieldPath(state, 'state'), display]
}
