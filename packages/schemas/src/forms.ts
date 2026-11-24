import type { ChoiceDefinition } from './choices.js'
import { z } from 'zod'
import {
  assetIdSchema,
  assertGraphicReference,
  graphicAppearanceSchema,
  type AssetCatalog,
} from './assets.js'
import type { CharacterProfileDefinition } from './characterProfile.js'
import type { GameDefinition } from './game.js'
import { gameIdSchema } from './gameId.js'
import { translationKeySchema } from './languages.js'
import type { GameTranslation } from './localization.js'
import { ruleStateType, type GameRulesDefinition } from './rules.js'
import type { RuleIssue } from './ruleValidation.js'
import type { SceneDefinition } from './scene.js'

const wording = { label: z.string().trim().min(1), labelKey: translationKeySchema.optional() }
const field = { ...wording, path: z.array(assetIdSchema).min(1) }

export const formElementSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('choice'), choice: gameIdSchema }),
  z.strictObject({
    type: z.literal('text'),
    ...field,
    default: z.string().default(''),
    trim: z.boolean().default(true),
  }),
  z.strictObject({ type: z.literal('number'), ...field, default: z.number().finite().default(0) }),
  z.strictObject({ type: z.literal('checkbox'), ...field, default: z.boolean().default(false) }),
  z.strictObject({ type: z.literal('portrait') }),
  z.strictObject({ type: z.literal('full-body') }),
  z.strictObject({
    type: z.literal('graphic'),
    visual: assetIdSchema,
    appearance: graphicAppearanceSchema.prefault({}),
    alt: z.string().default(''),
    altKey: translationKeySchema.optional(),
  }),
])

export const formSchema = z.strictObject({
  'schema-version': z.literal('1.0.0'),
  id: gameIdSchema,
  ...wording,
  rows: z.array(z.array(z.array(formElementSchema))),
})

export type FormDefinition = z.infer<typeof formSchema>

export type FormElement = z.infer<typeof formElementSchema>

export type FormField =
  | Extract<FormElement, { path: string[] }>
  | (ChoiceDefinition & { type: 'choice' })

export type FormValue = string | number | boolean

export function formFile(id: string) {
  return `forms/${id}.json`
}

export function formField(
  element: FormElement,
  choices?: ReadonlyMap<string, ChoiceDefinition>,
): FormField | undefined {
  if ('path' in element) return element

  if (element.type !== 'choice') return
  const field = choices?.get(element.choice)

  if (field) return { ...field, type: 'choice' }
}

export function validFormValue(field: FormField, value: unknown): value is FormValue {
  switch (field.type) {
    case 'choice':
      return field.options.some(({ id }) => id === value)
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'text':
      return typeof value === 'string'
    case 'checkbox':
      return typeof value === 'boolean'
  }
}

export function characterForm(id: string, profile: CharacterProfileDefinition): FormDefinition {
  return {
    'schema-version': '1.0.0',
    id,
    label: 'Create character',
    rows: [[[{ type: 'portrait' }], profile.fields.map((choice) => ({ type: 'choice', choice }))]],
  }
}

export function localizeForm(form: FormDefinition, translation?: GameTranslation): FormDefinition {
  const text = (key: string | undefined, literal: string) => {
    if (!key) return literal

    if (!translation || !Object.hasOwn(translation.fallback, key))
      throw new Error(`Missing default translation: ${key}`)

    return translation.messages[key] ?? translation.fallback[key]!
  }

  return formSchema.parse({
    ...form,
    label: text(form.labelKey, form.label),
    rows: form.rows.map((row) =>
      row.map((column) =>
        column.map((element) => {
          if (element.type === 'graphic')
            return { ...element, alt: text(element.altKey, element.alt) }

          if (!('label' in element)) return element

          return {
            ...element,
            label: text(element.labelKey, element.label),
          }
        }),
      ),
    ),
  })
}

export function formIssues(
  game: GameDefinition,
  forms: ReadonlyMap<string, FormDefinition>,
  scenes: ReadonlyMap<string, SceneDefinition>,
  rules: GameRulesDefinition,
  assets: AssetCatalog | undefined,
  choices: ReadonlyMap<string, ChoiceDefinition>,
): RuleIssue[] {
  const issues: RuleIssue[] = []
  const state = new Map(rules.state.map((field) => [JSON.stringify(field.path), field]))

  for (const id of game.forms ?? []) {
    const form = forms.get(id)
    const file = formFile(id)

    if (form?.id !== id) {
      issues.push({ file, path: ['id'], message: `Expected form ${id}` })
      continue
    }

    const paths = new Set<string>()
    form.rows.forEach((row, r) =>
      row.forEach((column, c) =>
        column.forEach((element, e) => {
          const path = ['rows', r, c, e]
          const add = (message: string) => issues.push({ file, path, message })

          if (
            (element.type === 'portrait' || element.type === 'full-body') &&
            !game.characterProfile
          )
            add('Choose a character profile for the appearance preview')

          if (element.type === 'graphic') {
            try {
              if (!assets) throw new Error('Graphics require an asset catalogue')
              assertGraphicReference(assets, element.visual, element.appearance)
            } catch (error) {
              add(String(error))
            }
          }

          const field = formField(element, choices)

          if (!field) {
            if (element.type === 'choice') add('Choose an existing library choice')

            return
          }

          const key = JSON.stringify(field.path)
          const declared = state.get(key)

          if (
            !declared ||
            ruleStateType(declared) !== typeof field.default ||
            [rules.clock?.path, rules.log?.path].some(
              (reserved) => JSON.stringify(reserved) === key,
            )
          )
            add('Choose a writable Rules field of the matching type')

          if (paths.has(key)) add('A form can edit a state path only once')
          paths.add(key)
        }),
      ),
    )
  }

  for (const [id, scene] of scenes)
    scene.components.forEach((component, index) => {
      if (component.type !== 'form') return

      const add = (key: string, message: string) =>
        issues.push({ file: `scenes/${id}.json`, path: ['components', index, key], message })

      if (!forms.has(component.form)) add('form', 'Choose an existing form')

      if (component.action && !Object.hasOwn(rules.actions, component.action))
        add('action', 'Choose an authored Rules action')

      if (
        (scene.type === 'stand-alone' || component.continueScene) &&
        scenes.get(component.continueScene ?? '')?.type !== 'game'
      )
        add('continueScene', 'Choose a game scene')

      if (
        component.backScene &&
        (component.backScene === id || scenes.get(component.backScene)?.type !== scene.type)
      )
        add('backScene', 'Choose another scene of the same type')
    })

  return issues
}
