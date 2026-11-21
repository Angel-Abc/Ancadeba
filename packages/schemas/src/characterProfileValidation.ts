import type { ChoiceDefinition } from './choices.js'
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
  choices: ReadonlyMap<string, ChoiceDefinition>,
): RuleIssue[] {
  const issues: RuleIssue[] = []
  const profile = game.characterProfile
  const fields = new Map(rules.state.map((field) => [JSON.stringify(field.path), field]))

  const add = (file: string, path: RuleIssue['path'], message: string) => {
    issues.push({ file, path, message })
  }

  if (profile) {
    const paths = new Set<string>()

    for (const [index, id] of profile.fields.entries()) {
      const choice = choices.get(id)
      const location = ['characterProfile', 'fields', index]

      if (!choice) {
        add('game.json', location, `Unknown library choice: ${id}`)
        continue
      }

      const path = JSON.stringify(choice.path)

      if (paths.has(path))
        add('game.json', location, 'Choose distinct Rules paths for profile fields')
      paths.add(path)
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

      if (component.type === 'character-sheet' && !profile)
        add(file, path, 'Define the game character profile first')

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
