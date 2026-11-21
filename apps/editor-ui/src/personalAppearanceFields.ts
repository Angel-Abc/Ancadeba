import type { ProjectView } from '@ancadeba/editor-core'
import { characterAppearance, type AppearanceLibrary, type AssetCatalog } from '@ancadeba/schemas'
import type { RuleFormControls } from './ruleFormControls.js'
import { graphicBindingForm } from './graphicBindingForm.js'

/** Only write an override after the author edits that individual choice. */
export function personalAppearanceFields(
  controls: RuleFormControls,
  view: ProjectView,
  catalog: AssetCatalog,
  preset: AppearanceLibrary['presets'][string],
  character: AppearanceLibrary['characters'][string],
  selected: string,
  selectSlot: (id: string) => void,
  change: (operation: () => void) => void,
  edited: () => void,
) {
  const { t, select, button, group, input } = controls
  const root = group(t('appearance.overrides'))
  const slots = catalog.compositions[preset.visual]?.slots ?? {}
  const slot = Object.hasOwn(slots, selected) ? selected : Object.keys(slots)[0]
  const choice = slot ? slots[slot] : undefined
  const values = slot ? character.overrides?.slots?.[slot] : character.overrides
  const current = () => (character.overrides ??= {})
  const edit = () => (slot ? ((current().slots ??= {})[slot] ??= {}) : current())
  const bindings = () => (edit().bindings ??= { colors: {} })
  const effective = characterAppearance(preset.appearance, character.overrides)
  const selection = slot ? effective.slots[slot] : undefined
  const part = selection?.part === undefined ? choice?.default : selection.part
  const actualParts = selection?.partBinding || !part ? (choice?.parts ?? []) : [part]
  const asset = catalog.images[preset.visual] ?? catalog.parts[preset.visual]
  const candidates = asset ? [asset] : actualParts.map((id) => catalog.parts[id]!)
  const first = candidates[0]

  const palettes = Object.keys(first?.palettes ?? {}).filter((id) =>
    candidates.every((candidate) => Object.hasOwn(candidate.palettes, id)),
  )

  const colors = Object.keys(first?.colors ?? {}).filter((id) =>
    candidates.every((candidate) => Object.hasOwn(candidate.colors, id)),
  )

  if (slot && choice) {
    const patch = character.overrides?.slots?.[slot]
    const editSlot = () => ((current().slots ??= {})[slot] ??= {})
    root.append(
      select(t('inspector.artSlot'), slot, Object.keys(slots), selectSlot, false),
      select(
        t('graphic.staticPart'),
        patch?.part === null ? '-' : patch?.part ? '+' + patch.part : '',
        [
          ['', t('appearance.inherit')],
          ['-', t('form.none')],
          ...choice.parts.map((id) => ['+' + id, id] as const),
        ],
        (value) =>
          change(() => {
            if (value) editSlot().part = value === '-' ? null : value.slice(1)
            else delete editSlot().part
          }),
      ),
      graphicBindingForm(
        controls,
        view,
        t('graphic.staticPart'),
        patch?.partBinding,
        'string',
        (binding) => {
          editSlot().partBinding = binding
        },
        change,
        edited,
      ),
    )
  }

  root.append(
    select(
      t('graphic.staticVisibility'),
      values?.visible === undefined ? '' : String(values.visible),
      [
        ['', t('appearance.inherit')],
        ['true', t('appearance.shown')],
        ['false', t('appearance.hidden')],
      ],
      (value) =>
        change(() => {
          if (value) edit().visible = value === 'true'
          else delete edit().visible
        }),
    ),
    graphicBindingForm(
      controls,
      view,
      t('graphic.staticVisibility'),
      values?.bindings?.visible,
      'boolean',
      (value) => {
        bindings().visible = value
      },
      change,
      edited,
    ),
  )

  if (palettes.length)
    root.append(
      select(
        t('graphic.staticPalette'),
        values?.palette ?? '',
        [['', t('appearance.inherit')], ...palettes],
        (value) =>
          change(() => {
            edit().palette = value || undefined
          }),
      ),
      graphicBindingForm(
        controls,
        view,
        t('graphic.staticPalette'),
        values?.bindings?.palette,
        'string',
        (value) => {
          bindings().palette = value
        },
        change,
        edited,
      ),
    )

  for (const color of colors) {
    root.append(
      input(t('graphic.hexColor') + ' (' + color + ')', values?.colors?.[color] ?? '', (value) => {
        const overrides = (edit().colors ??= {})

        if (value) overrides[color] = value
        else delete overrides[color]
        edited()
      }),
      graphicBindingForm(
        controls,
        view,
        color,
        values?.bindings?.colors[color],
        'string',
        (value) => {
          if (value) bindings().colors[color] = value
          else delete bindings().colors[color]
        },
        change,
        edited,
      ),
    )
  }

  root.append(
    button(
      t('appearance.resetSlot'),
      () =>
        change(() => {
          if (slot && character.overrides?.slots) delete character.overrides.slots[slot]
          else delete character.overrides
        }),
      !values,
    ),
  )

  return root
}
