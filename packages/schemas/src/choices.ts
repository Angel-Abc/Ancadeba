import { z } from 'zod'
import { assetIdSchema } from './assets.js'
import { gameIdSchema } from './gameId.js'
import type { FormDefinition } from './forms.js'
import { translationKeySchema } from './languages.js'
import type { GameTranslation } from './localization.js'
import type { GameRulesDefinition } from './rules.js'
import type { RuleIssue } from './ruleValidation.js'

const wording = { label: z.string().trim().min(1), labelKey: translationKeySchema.optional() }

export const choiceSchema = z
  .strictObject({
    'schema-version': z.literal('1.0.0'),
    id: gameIdSchema,
    ...wording,
    path: z.array(assetIdSchema).min(1),
    options: z.array(z.strictObject({ id: assetIdSchema, ...wording })).min(1),
    default: assetIdSchema,
  })
  .superRefine((choice, context) => {
    const ids = new Set<string>()
    choice.options.forEach((option, index) => {
      if (ids.has(option.id))
        context.addIssue({
          code: 'custom',
          path: ['options', index, 'id'],
          message: 'Option IDs must be unique',
        })
      ids.add(option.id)
    })

    if (!ids.has(choice.default))
      context.addIssue({
        code: 'custom',
        path: ['default'],
        message: 'Choose an existing option as the default',
      })
  })

export type ChoiceDefinition = z.infer<typeof choiceSchema>

export function choiceFile(id: string) {
  return `choices/${id}.json`
}

export function choiceFormIds(id: string, forms: Iterable<FormDefinition>) {
  return Array.from(forms)
    .filter((form) =>
      form.rows.flat(2).some((element) => element.type === 'choice' && element.choice === id),
    )
    .map((form) => form.id)
}

export function choiceIssues(
  ids: readonly string[],
  choices: ReadonlyMap<string, ChoiceDefinition>,
  rules: GameRulesDefinition,
): RuleIssue[] {
  const issues: RuleIssue[] = []
  const state = new Map(rules.state.map((field) => [JSON.stringify(field.path), field.value]))

  for (const id of ids) {
    const file = choiceFile(id)
    const choice = choices.get(id)

    if (choice?.id !== id) {
      issues.push({ file, path: ['id'], message: `Expected choice ID ${id}` })
      continue
    }

    const path = JSON.stringify(choice.path)
    const value = state.get(path)

    if (
      !choice.options.some((option) => option.id === value) ||
      [rules.clock?.path, rules.log?.path].some((reserved) => JSON.stringify(reserved) === path)
    )
      issues.push({
        file,
        path: ['path'],
        message: 'Choose a writable Rules text field initialized to a valid option ID',
      })
  }

  return issues
}

export function localizeChoice(
  choice: ChoiceDefinition,
  translation?: GameTranslation,
): ChoiceDefinition {
  function wording<T extends { label: string; labelKey?: string | undefined }>(entry: T) {
    const key = entry.labelKey

    if (!key) return entry

    if (!translation || !Object.hasOwn(translation.fallback, key))
      throw new Error(`Missing default translation: ${key}`)

    return { ...entry, label: translation.messages[key] ?? translation.fallback[key]! }
  }

  return choiceSchema.parse({ ...wording(choice), options: choice.options.map(wording) })
}
