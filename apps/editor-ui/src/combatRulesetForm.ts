import {
  resolveCombatRuleset,
  resolveCombatSource,
  diffCombatMechanics,
  cloneCombatRules,
  previewCombatMechanicsOverrides,
  type CombatSource,
  type CombatMechanicsDefinition,
} from '@ancadeba/schemas'
import type { ProjectView } from '@ancadeba/editor-core'
import { combatRulesetLayersForm } from './combatRulesetLayersForm.js'
import { combatMechanicsForm } from './combatMechanicsForm.js'
import { ruleFormControls, type RuleFormControls } from './ruleFormControls.js'

export function combatRulesetForm(
  controls: RuleFormControls,
  view: ProjectView,
  draft: CombatSource,
  render: () => void,
  statuses = draft.statuses,
): HTMLElement {
  const { group, button, create, t } = controls
  const text = (key: string) => t(`combat.rulesets.${key}`)
  const libraries = new Map(Object.entries(view.combatLibraries ?? {}))
  const resolved = resolveCombatRuleset(draft, libraries)
  const references = draft.rulesets ?? []

  const choices = [...libraries].flatMap(([library, data]) =>
    Object.entries(data.rulesets ?? {}).map(
      ([id, entry]) =>
        [
          `${library}/${id}`,
          `${entry.labelKey ? view.translations?.[entry.labelKey] || entry.label || id : entry.label || id} (${library}/${id})`,
        ] as const,
    ),
  )

  const edit = (action: () => void) => () => {
    action()
    controls.markEdited()
    render()
  }

  const detach = () => {
    if (references.length && !resolved.mechanics) return
    const resolvedSource = resolveCombatSource(draft, libraries, undefined, view.inventory)

    for (const kind of ['moves', 'statuses'] as const) {
      const key = kind === 'moves' ? 'sharedMoves' : 'sharedStatuses'

      for (const [id, origin] of Object.entries(resolvedSource.origins[kind])) {
        if (
          origin.library &&
          !draft[key]?.some((ref) => ref.library === origin.library && ref.id === id)
        )
          (draft[key] ??= []).push({ library: origin.library, id })
      }
    }

    draft.mechanics = resolved.mechanics ? cloneCombatRules(resolved.mechanics) : undefined
    draft.rulesets = []
    draft.mechanicsOverrides = undefined
  }

  const layers = combatRulesetLayersForm(
    controls,
    draft,
    libraries,
    choices,
    render,
    detach,
    references.length > 0 && Boolean(resolved.mechanics),
  )

  const help = create('p')
  help.className = 'help'
  help.textContent = references.length ? text('inheritHelp') : text('selectHelp')

  if (!references.length)
    return group(
      text('encounter'),
      layers,
      help,
      combatMechanicsForm(controls, view, draft, render, statuses),
    )

  const alerts = create('p')
  alerts.setAttribute('role', 'alert')
  alerts.textContent = resolved.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  const conflicts = create('ul')

  for (const conflict of resolved.conflicts) {
    const row = create('li')
    row.textContent = t(
      conflict.replaced ? 'combat.composition.replaced' : 'combat.composition.conflict',
      {
        section: conflict.section,
        id: conflict.id,
        previous: conflict.previous,
        next: conflict.next,
      },
    )
    conflicts.append(row)
  }

  const reset = button(
    text('resetAll'),
    edit(() => {
      draft.mechanicsOverrides = {}
    }),
  )

  if (!resolved.base) return group(text('encounter'), layers, help, alerts, reset)
  const base = resolved.base

  const mechanicsDraft = {
    ...draft,
    mechanics: resolved.mechanics
      ? cloneCombatRules(resolved.mechanics)
      : previewCombatMechanicsOverrides(base, draft.mechanicsOverrides),
  }

  const sync = () => {
    draft.mechanicsOverrides = diffCombatMechanics(base, mechanicsDraft.mechanics)
  }

  const localControls = ruleFormControls(
    create('div').ownerDocument,
    () => {
      sync()
      controls.markEdited()
    },
    t,
    controls.folds,
  )

  const localRender = () => {
    sync()
    render()
  }

  const overrides = create('ul')

  for (const section of ['resources', 'triggers', 'phases'] as const) {
    const ids = new Set([
      ...Object.keys(base[section]),
      ...Object.keys(draft.mechanicsOverrides?.[section] ?? {}),
    ])

    for (const id of ids) {
      const row = create('li')
      const patch = draft.mechanicsOverrides?.[section]?.[id]
      const name = create('span')
      const origin = resolved.baseOrigins[section][id]
      name.textContent = `${section} · ${id}: ${patch === null ? text('excluded') : patch ? text('overridden') : text('inherited')}${origin?.library ? ` (${origin.library}/${origin.ruleset})` : ''} `
      row.append(name)

      if (patch !== undefined)
        row.append(
          button(
            t('combat.rulesets.resetEntry', { id }),
            edit(() => {
              delete draft.mechanicsOverrides?.[section]?.[id]
            }),
          ),
        )
      else
        row.append(
          button(
            t('combat.rulesets.excludeEntry', { id }),
            edit(() => {
              draft.mechanicsOverrides ??= {}
              const entries = draft.mechanicsOverrides[section] ?? {}
              entries[id] = null
              draft.mechanicsOverrides[section] = entries
            }),
          ),
        )
      overrides.append(row)
    }
  }

  const settings = (['initialPhase', 'victory', 'triggerOrder'] as const)
    .filter((key) => draft.mechanicsOverrides?.[key] !== undefined)
    .map((key) =>
      button(
        t('combat.rulesets.resetSetting', { setting: key }),
        edit(() => {
          delete draft.mechanicsOverrides?.[key]
        }),
      ),
    )

  const preview = create('p')
  preview.textContent = t('combat.rulesets.effective', {
    resources: Object.keys(mechanicsDraft.mechanics.resources).length,
    triggers: Object.keys(mechanicsDraft.mechanics.triggers).length,
    phases: Object.keys(mechanicsDraft.mechanics.phases).length,
  })

  return group(
    text('encounter'),
    layers,
    help,
    alerts,
    conflicts,
    preview,
    overrides,
    ...settings,
    reset,
    combatMechanicsForm(localControls, view, mechanicsDraft, localRender, statuses, false),
  )
}

/** Available resources for ability/cost forms include the inherited encounter mechanics. */
export function combatDraftMechanics(
  draft: CombatSource,
  view: ProjectView,
): CombatMechanicsDefinition | undefined {
  const resolved = resolveCombatRuleset(draft, new Map(Object.entries(view.combatLibraries ?? {})))

  return (
    resolved.mechanics ??
    (resolved.base
      ? previewCombatMechanicsOverrides(resolved.base, draft.mechanicsOverrides)
      : undefined)
  )
}
