import { fieldPath, type EntrySelections } from './specialistEntries.js'
import type { Translate } from '@ancadeba/utilities'
import { assetIdSchema, type GraphicPart, type GraphicComposition } from '@ancadeba/schemas'
import type { RuleFormControls } from './ruleFormControls.js'

export interface GraphicDefinitionPending {
  piece: string
  layer: string
  anchor: string
  slot: string
  color: string
  palette: string
}

export interface GraphicDefinitionControls {
  controls: RuleFormControls
  entries: EntrySelections
  pending: GraphicDefinitionPending
  change: (operation: () => void) => void
  edited: () => void
}

export function requireDefinitionId(id: string, ids: readonly string[], t: Translate) {
  if (!assetIdSchema.safeParse(id).success || ids.includes(id))
    throw new Error(t('definitions.invalidId'))
}

export function boundsForm(
  context: GraphicDefinitionControls,
  definition: GraphicPart | GraphicComposition,
) {
  const { controls, edited } = context
  const { t } = controls

  return controls.group(
    t('definitions.previewBounds'),
    ...(['x', 'y', 'width', 'height'] as const).map((key) =>
      fieldPath(
        controls.input(
          t('definitions.bounds', { key }),
          String(definition.bounds[key]),
          (value) => {
            definition.bounds[key] = Number(value)
            edited()
          },
          'number',
        ),
        'bounds',
        key,
      ),
    ),
  )
}

export function moveDefinitionEntry<T>(entries: T[], index: number, offset: number) {
  const target = index + offset

  if (target < 0 || target >= entries.length) return
  const [entry] = entries.splice(index, 1)
  entries.splice(target, 0, entry!)
}

export function partColorsForm(
  context: GraphicDefinitionControls,
  part: GraphicPart,
): HTMLElement[] {
  const { controls, pending, change, edited } = context
  const { group, input, select, button, t } = controls
  const colors = Object.keys(part.colors)

  const colorFields = group(
    t('definitions.partColors'),
    ...colors.map((id) =>
      group(
        t('form.color', { id }),
        fieldPath(
          input(
            t('definitions.defaultColor'),
            part.colors[id]!,
            (value) => {
              part.colors[id] = value
              edited()
            },
            'color',
          ),
          'colors',
          id,
        ),
        button(t('definitions.removeColor', { id }), () =>
          change(() => {
            delete part.colors[id]

            for (const palette of Object.values(part.palettes)) delete palette[id]

            for (const piece of part.pieces)
              for (const [slot, value] of Object.entries(piece.slots))
                if (value === id) delete piece.slots[slot]
          }),
        ),
      ),
    ),
    fieldPath(
      input(t('definitions.newColorId'), pending.color, (value) => {
        pending.color = value.trim()
      }),
      'pending',
      'color',
    ),
    button(t('definitions.addColor'), () =>
      change(() => {
        requireDefinitionId(pending.color, colors, t)
        part.colors[pending.color] = '#ffffff'
        pending.color = ''
      }),
    ),
  )

  const paletteFields = group(
    t('definitions.palettes'),
    ...Object.entries(part.palettes).map(([id, palette]) =>
      group(
        t('definitions.palette', { id }),
        ...colors.flatMap((color) => [
          select(
            // The palette group names the palette; each row only names its color.
            color,
            String(Object.hasOwn(palette, color)),
            [
              ['false', t('definitions.useDefaultColor')],
              ['true', t('definitions.customColor')],
            ],
            (value) =>
              change(() => {
                if (value === 'true') palette[color] = part.colors[color]!
                else delete palette[color]
              }),
          ),
          ...(Object.hasOwn(palette, color)
            ? [
                fieldPath(
                  input(
                    t('definitions.colorOf', { color }),
                    palette[color]!,
                    (value) => {
                      palette[color] = value
                      edited()
                    },
                    'color',
                  ),
                  'palettes',
                  id,
                  color,
                ),
              ]
            : []),
        ]),
        button(t('definitions.removePalette', { id }), () =>
          change(() => {
            delete part.palettes[id]
          }),
        ),
      ),
    ),
    fieldPath(
      input(t('definitions.newPaletteId'), pending.palette, (value) => {
        pending.palette = value.trim()
      }),
      'pending',
      'palette',
    ),
    button(t('definitions.addPalette'), () =>
      change(() => {
        requireDefinitionId(pending.palette, Object.keys(part.palettes), t)
        part.palettes[pending.palette] = {}
        pending.palette = ''
      }),
    ),
  )

  return [
    controls.section('colors', fieldPath(colorFields, 'colors')),
    controls.section('palettes', fieldPath(paletteFields, 'palettes')),
  ]
}
