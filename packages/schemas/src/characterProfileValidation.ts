import { assertGraphicReference, type AssetCatalog } from './assets.js'
import type { GameDefinition } from './game.js'
import { ruleStateType, type GameRulesDefinition } from './rules.js'
import type { SceneDefinition } from './scene.js'
import type { RuleIssue } from './ruleValidation.js'

export function characterProfileIssues(
  game: GameDefinition,
  scenes: ReadonlyMap<string, SceneDefinition>,
  rules: GameRulesDefinition,
  assets: AssetCatalog | undefined,
): RuleIssue[] {
  const issues: RuleIssue[] = []
  const profile = game.characterProfile
  const fields = new Map(rules.state.map((field) => [JSON.stringify(field.path), field]))

  const add = (file: string, path: RuleIssue['path'], message: string) => {
    issues.push({ file, path, message })
  }

  if (profile) {
    for (const [index, field] of profile.fields.entries()) {
      const state = fields.get(JSON.stringify(field.path))

      if (
        !state ||
        typeof state.value !== 'string' ||
        !field.options.some(({ id }) => id === state.value)
      )
        add(
          'game.json',
          ['characterProfile', 'fields', index, 'path'],
          'Choose a Rules text field initialized to a valid option ID',
        )
    }

    try {
      if (!assets) throw new Error('A character portrait requires an asset catalogue')
      assertGraphicReference(assets, profile.portrait.visual, profile.portrait.appearance)
    } catch (error) {
      add(
        'game.json',
        ['characterProfile', 'portrait'],
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  for (const [id, scene] of scenes) {
    const file = `scenes/${id}.json`

    for (const [index, component] of scene.components.entries()) {
      const path = ['components', index]

      if (component.type === 'character-creator' || component.type === 'character-sheet') {
        if (!profile) add(file, path, 'Define the game character profile first')

        if (component.type === 'character-creator') {
          if (
            scenes.get(component.continueScene)?.type !== 'game' ||
            component.continueScene === id
          )
            add(file, [...path, 'continueScene'], 'Choose another game scene to continue to')

          if (
            component.backScene &&
            (scenes.get(component.backScene)?.type !== scene.type || component.backScene === id)
          )
            add(file, [...path, 'backScene'], 'Choose another scene of the same type to go back to')
        }
      }

      if (component.type === 'status-panel' || component.type === 'character-sheet') {
        for (const [rowIndex, row] of component.rows.entries()) {
          const binding = row.visibleWhen

          if (binding?.source !== 'game.state') continue
          const field = fields.get(JSON.stringify(binding.path))

          if (!field || ruleStateType(field) !== 'boolean')
            add(
              file,
              [...path, 'rows', rowIndex, 'visibleWhen'],
              'Choose a boolean Rules field for row visibility',
            )
        }
      }
    }
  }

  return issues
}
