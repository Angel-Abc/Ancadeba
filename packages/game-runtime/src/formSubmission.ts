import {
  formField,
  validFormValue,
  type FormValue,
  type RuleCondition,
  type SceneTransition,
  type RuntimeTextKey,
} from '@ancadeba/schemas'
import type { AuthoredPlaythrough } from './authoredRules.js'
import type { GameInstance, IGameLifecycle, SceneInstance } from './gameLifecycle.js'
import { prepareInventoryCollection } from './inventoryCollection.js'
import type { GameActionRuntime } from './gameActionRuntime.js'
import { sceneEntranceCost } from './sceneNavigation.js'
import { runtimeText } from './runtimeText.js'
import { matchesConditions, notifyStory } from './storyConditions.js'

type Placement = Extract<SceneInstance['data']['components'][number], { type: 'form' }>

export type SubmitForm = (
  origin: SceneInstance,
  componentId: string,
  answers: ReadonlyMap<string, FormValue>,
) => string | undefined

function prepareSubmission(
  game: GameInstance,
  scene: SceneInstance,
  component: Placement,
  answers: ReadonlyMap<string, FormValue>,
  state: AuthoredPlaythrough,
  runtime: GameActionRuntime,
  current: () => boolean,
) {
  const text = (key: RuntimeTextKey, values?: Record<string, string>) =>
    runtimeText(game.data, key, values)

  const definition = game.data.forms?.get(component.form)

  if (!definition) throw new Error(text('form.unavailable'))

  const fields = definition.rows
    .flat(2)
    .flatMap((element) => formField(element, game.data.characterProfile) ?? [])

  if (fields.length !== answers.size) throw new Error(text('form.incomplete'))

  const writes = fields.map((field) => {
    const value = answers.get(JSON.stringify(field.path))

    if (!validFormValue(field, value))
      throw new Error(text('form.invalidField', { field: field.label }))

    return { type: 'set-state' as const, path: field.path, value }
  })

  const branches = component.action ? game.data.rules?.actions[component.action] : undefined

  const matches = (condition: RuleCondition) =>
    condition.type !== 'payload-is-item' &&
    condition.type !== 'payload-is-target' &&
    matchesConditions([condition], { game, scene, values: answers })

  const branch = branches?.find((entry) => entry.when.every(matches))

  if (component.action && !branch) {
    for (const entry of branches ?? []) {
      const unmet = entry.when.filter((condition) => !matches(condition))

      if (
        !unmet.every(
          (condition) =>
            (condition.type === 'state-is' || condition.type === 'state-compare') &&
            answers.has(JSON.stringify(condition.path)),
        )
      )
        continue
      const condition = unmet[0]

      if (condition?.type !== 'state-is' && condition?.type !== 'state-compare') continue

      const field = fields.find(
        (item) => JSON.stringify(item.path) === JSON.stringify(condition.path),
      )!

      if (field.type === 'checkbox')
        throw new Error(
          text(condition.value ? 'form.check' : 'form.uncheck', { field: field.label }),
        )

      const operator =
        condition.type === 'state-compare'
          ? { eq: '=', gte: '≥', lte: '≤', gt: '>', lt: '<' }[condition.operator]
          : '='

      const expected =
        field.type === 'choice'
          ? field.options.find((option) => option.id === condition.value)?.label
          : undefined

      throw new Error(
        text('form.requirement', {
          field: field.label,
          requirement: operator + ' ' + (expected ?? String(condition.value)),
        }),
      )
    }

    throw new Error(text('form.rejected'))
  }

  const effects = branch?.effects ?? []

  const destination: SceneTransition | undefined =
    effects.find((effect) => effect.type === 'enter-scene') ??
    (component.continueScene ? { type: 'enter-scene', scene: component.continueScene } : undefined)

  const move = effects.find(
    (effect) => effect.type === 'move-item' || effect.type === 'collect-items',
  )

  const transfer =
    move?.type === 'collect-items'
      ? prepareInventoryCollection(game.inventory, move.items, move.owner)
      : move &&
          game.inventory?.snapshot.find((item) => item.id === move.item)?.placement.type ===
            'carried'
        ? game.inventory?.prepareTransfer?.(move.item, { type: 'carried', owner: move.owner })
        : undefined

  if (move && !transfer?.isCurrent()) throw new Error(text('form.items'))

  const storyEffects = effects.filter(
    (effect) =>
      effect.type !== 'move-item' &&
      effect.type !== 'collect-items' &&
      effect.type !== 'enter-scene',
  )

  const hasQuest = storyEffects.some(
    (effect) => effect.type === 'start-quest' || effect.type === 'complete-quest',
  )

  const quest = hasQuest
    ? game.quests?.prepareEffects(scene, storyEffects, { answers, pendingStart: current })
    : undefined

  if (hasQuest && (!quest?.isCurrent() || move)) throw new Error(text('form.quest'))
  const allWrites = [...writes, ...storyEffects.filter((effect) => effect.type === 'set-state')]
  const logs = storyEffects.filter((effect) => effect.type === 'append-log')

  const batch = state.prepareFormWrites(
    quest
      ? writes.filter((write) => quest.values.get(JSON.stringify(write.path)) === write.value)
      : allWrites,
    quest ? [] : logs,
  )

  const proposedState = (path: readonly string[]) => {
    const key = JSON.stringify(path)
    const value = quest?.values.get(key) ?? batch.values.get(key)

    if (value !== undefined) return value
    const result = game.bindings?.read({ source: 'game.state', path })

    return result?.status === 'resolved' ? result.value : undefined
  }

  const cost = destination
    ? sceneEntranceCost(game.data, destination, game.mapMovement, proposedState)
    : 0

  if (cost === undefined) throw new Error(text('form.destination'))

  const action = component.action
    ? runtime.actions.prepareFormAction(component.action, cost)
    : undefined

  const time = action?.progression.worldTimeMs ?? runtime.actions.progression.worldTimeMs

  return {
    destination,
    commit() {
      if (
        !current() ||
        (transfer && !transfer.isCurrent()) ||
        (quest && !quest.isCurrent()) ||
        (action && !action.isCurrent())
      )
        throw new Error(text('form.changed'))
      quest?.commit()
      transfer?.commit()
      batch.commit(time)
      action?.commit()

      if (action) state.updateClock(time)
    },
    notify() {
      notifyStory([
        () => action?.notify(),
        () => quest?.notify(),
        () => transfer?.notify(),
        () => runtime.bindings.invalidate(),
      ])
    },
  }
}

export function formSubmission(
  lifecycle: IGameLifecycle,
  playthroughFor: (game: GameInstance) => AuthoredPlaythrough | undefined,
  settle: () => boolean,
  runtimeFor: (game: GameInstance) => GameActionRuntime | undefined,
  report: (error: unknown) => void,
  data: GameInstance['data'],
): SubmitForm {
  const text = (key: RuntimeTextKey) => runtimeText(data, key)
  let submitting = false

  return (origin, id, answers) => {
    if (submitting) return text('form.busy')
    submitting = true

    try {
      if (!settle() || lifecycle.activeScene !== origin) return text('form.expired')
      const component = origin.data.components.find((entry) => entry.id === id)

      if (component?.type !== 'form') return text('form.unavailable')
      let prepared: ReturnType<typeof prepareSubmission> | undefined

      const active = lifecycle.currentGame

      if (origin.type === 'game' && active !== origin.game) return text('form.inactive')

      if (origin.type === 'stand-alone' && active) return text('form.paused')

      if (!lifecycle.applyGameChange) return text('form.unsupported')
      let committed: GameInstance | undefined

      try {
        lifecycle.applyGameChange((game) => {
          const playthrough = playthroughFor(game)
          const runtime = runtimeFor(game)

          if (!playthrough || !runtime) throw new Error(text('form.unsupported'))

          const submission = prepareSubmission(
            game,
            origin,
            component,
            answers,
            playthrough,
            runtime,
            () =>
              lifecycle.activeScene === origin &&
              !game.disposed &&
              lifecycle.currentGame === active,
          )

          prepared = submission

          return {
            destination: submission.destination,
            commit() {
              submission.commit()
              committed = game
            },
          }
        })
      } catch (error) {
        if (
          !committed ||
          committed !== lifecycle.currentGame ||
          (prepared?.destination && lifecycle.activeScene?.data.id !== prepared.destination.scene)
        )
          throw error
        report(error)
      }

      try {
        prepared?.notify()
      } catch (error) {
        report(error)
      }

      return undefined
    } catch (error) {
      return error instanceof Error ? error.message : String(error)
    } finally {
      submitting = false
    }
  }
}
