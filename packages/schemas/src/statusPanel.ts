import type { AppearanceLibrary } from './characterAppearances.js'
import { assertGraphicReference, graphicAppearanceSchema, type AssetCatalog } from './assets.js'
import type { GameBindingDefinition } from './bindings.js'
import type { StatusPanelComponentDefinition } from './scene.js'

export function statusPanelBindings(
  panel: Pick<StatusPanelComponentDefinition, 'rows'> &
    Partial<Pick<StatusPanelComponentDefinition, 'effects'>>,
): { binding: GameBindingDefinition; expected: 'number' | 'value' | 'boolean' }[] {
  const result: ReturnType<typeof statusPanelBindings> = []

  for (const row of panel.rows) {
    if (row.visibleWhen) result.push({ binding: row.visibleWhen, expected: 'boolean' })

    if (typeof row.value === 'object')
      result.push({ binding: row.value, expected: row.type === 'bar' ? 'number' : 'value' })

    if (row.type === 'bar' && typeof row.maximum === 'object')
      result.push({ binding: row.maximum, expected: 'number' })
  }

  for (const effect of panel.effects ?? [])
    if (effect.visibleWhen) result.push({ binding: effect.visibleWhen, expected: 'boolean' })

  return result
}

/** Shared startup, editor, and export checks for optional status artwork. */
export function statusPanelIssues(
  panel: StatusPanelComponentDefinition,
  assets?: AssetCatalog,
  appearances?: AppearanceLibrary,
): { path: (string | number)[]; message: string }[] {
  const references = panel.effects.flatMap((effect, index) =>
    effect.icon ? [{ visual: effect.icon, path: ['effects', index, 'icon'] }] : [],
  )

  const issues = references.flatMap(({ visual, path }) => {
    try {
      if (!assets) throw new Error('Status artwork requires an asset catalogue')
      assertGraphicReference(assets, visual, graphicAppearanceSchema.parse({}))

      return []
    } catch (error) {
      return [{ path, message: error instanceof Error ? error.message : String(error) }]
    }
  })

  if (panel.portrait && !Object.hasOwn(appearances?.characters ?? {}, panel.portrait.character))
    issues.push({
      path: ['portrait', 'character'],
      message: 'Unknown character: ' + panel.portrait.character,
    })

  return issues
}
