import type { AssetCatalog, GraphicComposition } from '@ancadeba/schemas'
import {
  boundsForm,
  moveDefinitionEntry,
  requireDefinitionId,
  type GraphicDefinitionControls,
} from './graphicDefinitionForms.js'
import { entryEditor, fieldPath } from './specialistEntries.js'

/** Include the chosen part's attachment requirements without moving existing anchors. */
function includePart(composition: GraphicComposition, id: string, catalog: AssetCatalog) {
  for (const piece of catalog.parts[id]?.pieces ?? []) {
    if (!composition.layers.includes(piece.layer)) composition.layers.push(piece.layer)

    if (!Object.hasOwn(composition.anchors, piece.anchor))
      composition.anchors[piece.anchor] = { ...piece.sourceAnchor }
  }
}

export function compositionDefinitionForm(
  context: GraphicDefinitionControls,
  catalog: AssetCatalog,
  composition: GraphicComposition,
): HTMLElement[] {
  const { controls, pending, change, edited } = context
  const { group, input, select, button, t } = controls
  const parts = Object.keys(catalog.parts)

  const slots = Object.keys(composition.slots)

  return [
    group(
      t('definitions.slots'),
      entryEditor(
        controls,
        context.entries,
        'slots',
        t('definitions.slots'),
        slots,
        (id) => id,
        (id) => {
          const slot = composition.slots[id]!
          const checklist = group(t('definitions.allowedParts'))
          checklist.className = 'allowed-parts'

          for (const part of parts) {
            const check = controls.create('input')
            check.type = 'checkbox'
            check.checked = slot.parts.includes(part)
            check.setAttribute('aria-label', t('definitions.allowPart', { part }))
            check.addEventListener('change', () =>
              change(() => {
                if (check.checked) {
                  slot.parts = [...new Set([...slot.parts, part])]
                  includePart(composition, part, catalog)
                } else {
                  slot.parts = slot.parts.filter((value) => value !== part)

                  if (slot.default === part) slot.default = null
                }
              }),
            )
            const label = controls.create('label')
            label.append(check, part)
            checklist.append(label)
          }

          return fieldPath(
            group(
              t('form.slot', { id }),
              fieldPath(
                select(
                  t('definitions.defaultPart'),
                  slot.default ?? '',
                  [['', t('form.none')], ...slot.parts],
                  (value) => {
                    slot.default = value || null
                    edited()
                  },
                ),
                'slots',
                id,
                'default',
              ),
              fieldPath(checklist, 'slots', id, 'parts'),
              button(t('definitions.removeSlot', { id }), () =>
                change(() => {
                  delete composition.slots[id]
                }),
              ),
            ),
            'slots',
            id,
          )
        },
        { path: ['slots'], ids: slots },
      ),
      fieldPath(
        input(t('form.newSlotId'), pending.slot, (value) => {
          pending.slot = value.trim()
        }),
        'pending',
        'slot',
      ),
      button(
        t('definitions.addSlot'),
        () =>
          change(() => {
            requireDefinitionId(pending.slot, Object.keys(composition.slots), t)
            const part = parts[0]

            if (!part) throw new Error(t('definitions.partFirst'))
            context.entries.slots = slots.length
            composition.slots[pending.slot] = { parts: [part], default: part }
            includePart(composition, part, catalog)
            pending.slot = ''
          }),
        !parts.length,
      ),
    ),
    controls.section(
      'layers',
      fieldPath(
        group(
          t('definitions.layers'),
          ...composition.layers.map((id, index) =>
            group(
              t('definitions.layerNumber', { number: index + 1 }),
              fieldPath(
                input(t('definitions.layerId'), id, (value) => {
                  composition.layers[index] = value.trim()
                  edited()
                }),
                'layers',
                index,
              ),
              button(
                t('definitions.moveLayerBack', { id }),
                () => change(() => moveDefinitionEntry(composition.layers, index, -1)),
                index === 0,
              ),
              button(
                t('definitions.moveLayerForward', { id }),
                () => change(() => moveDefinitionEntry(composition.layers, index, 1)),
                index === composition.layers.length - 1,
              ),
              button(
                t('definitions.removeLayer', { id }),
                () =>
                  change(() => {
                    composition.layers.splice(index, 1)
                  }),
                composition.layers.length <= 1,
              ),
            ),
          ),
          fieldPath(
            input(t('definitions.newLayerId'), pending.layer, (value) => {
              pending.layer = value.trim()
            }),
            'pending',
            'layer',
          ),
          button(t('definitions.addLayer'), () =>
            change(() => {
              requireDefinitionId(pending.layer, composition.layers, t)
              composition.layers.push(pending.layer)
              pending.layer = ''
            }),
          ),
        ),
        'layers',
      ),
    ),
    controls.section(
      'anchors',
      fieldPath(
        group(
          t('definitions.destinationAnchors'),
          ...Object.entries(composition.anchors).map(([id, point]) =>
            group(
              t('definitions.anchor', { id }),
              ...(['x', 'y'] as const).map((key) =>
                fieldPath(
                  input(
                    t('definitions.anchorAxis', { axis: key }),
                    String(point[key]),
                    (value) => {
                      point[key] = Number(value)
                      edited()
                    },
                    'number',
                  ),
                  'anchors',
                  id,
                  key,
                ),
              ),
              button(t('definitions.removeAnchor', { id }), () =>
                change(() => {
                  delete composition.anchors[id]
                }),
              ),
            ),
          ),
          fieldPath(
            input(t('definitions.newAnchorId'), pending.anchor, (value) => {
              pending.anchor = value.trim()
            }),
            'pending',
            'anchor',
          ),
          button(t('definitions.addAnchor'), () =>
            change(() => {
              requireDefinitionId(pending.anchor, Object.keys(composition.anchors), t)
              composition.anchors[pending.anchor] = { x: 0, y: 0 }
              pending.anchor = ''
            }),
          ),
        ),
        'anchors',
      ),
    ),
    controls.section('bounds', fieldPath(boundsForm(context, composition), 'bounds')),
  ]
}
