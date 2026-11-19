import { entryEditor, fieldPath } from './specialistEntries.js'
import { partPieceSchema, type AssetCatalog, type GraphicPart } from '@ancadeba/schemas'
import {
  boundsForm,
  partColorsForm,
  moveDefinitionEntry,
  requireDefinitionId,
  type GraphicDefinitionControls,
} from './graphicDefinitionForms.js'

/** A part groups image pieces, transforms and color mappings into one selectable object. */
export function partDefinitionForm(
  context: GraphicDefinitionControls,
  catalog: AssetCatalog,
  part: GraphicPart,
): HTMLElement[] {
  const { controls, pending, change, edited } = context
  const { group, input, select, button, t } = controls

  return [
    group(
      t('definitions.pieces'),
      entryEditor(
        controls,
        context.entries,
        'pieces',
        t('definitions.pieces'),
        part.pieces,
        (piece) => piece.id,
        (piece, index) =>
          fieldPath(
            group(
              t('definitions.piece', { id: piece.id }),
              fieldPath(
                select(
                  t('definitions.pieceImage'),
                  piece.image,
                  Object.keys(catalog.images),
                  (value) =>
                    change(() => {
                      piece.image = value
                      piece.slots = Object.fromEntries(
                        Object.entries(piece.slots).filter(([id]) =>
                          Object.hasOwn(catalog.images[value]?.colors ?? {}, id),
                        ),
                      )
                    }),
                ),
                'pieces',
                index,
                'image',
              ),
              fieldPath(
                input(t('definitions.pieceLayer'), piece.layer, (value) => {
                  piece.layer = value.trim()
                  edited()
                }),
                'pieces',
                index,
                'layer',
              ),
              fieldPath(
                input(t('definitions.destinationAnchor'), piece.anchor, (value) => {
                  piece.anchor = value.trim()
                  edited()
                }),
                'pieces',
                index,
                'anchor',
              ),
              ...(['x', 'y'] as const).map((key) =>
                fieldPath(
                  input(
                    t('definitions.sourceAnchor', { axis: key }),
                    String(piece.sourceAnchor[key]),
                    (value) => {
                      piece.sourceAnchor[key] = Number(value)
                      edited()
                    },
                    'number',
                  ),
                  'pieces',
                  index,
                  'sourceAnchor',
                  key,
                ),
              ),
              fieldPath(
                input(
                  t('definitions.pieceScale'),
                  String(piece.scale),
                  (value) => {
                    piece.scale = Number(value)
                    edited()
                  },
                  'number',
                ),
                'pieces',
                index,
                'scale',
              ),
              fieldPath(
                input(
                  t('definitions.pieceRotation'),
                  String(piece.rotation),
                  (value) => {
                    piece.rotation = Number(value)
                    edited()
                  },
                  'number',
                ),
                'pieces',
                index,
                'rotation',
              ),
              ...Object.keys(catalog.images[piece.image]?.colors ?? {}).map((id) =>
                fieldPath(
                  select(
                    t('definitions.mapColor', { id }),
                    piece.slots[id] ?? '',
                    [['', t('definitions.imageDefault')], ...Object.keys(part.colors)],
                    (value) => {
                      if (value) piece.slots[id] = value
                      else delete piece.slots[id]
                      edited()
                    },
                  ),
                  'pieces',
                  index,
                  'slots',
                  id,
                ),
              ),
              button(
                t('definitions.movePieceUp', { id: piece.id }),
                () =>
                  change(() => {
                    moveDefinitionEntry(part.pieces, index, -1)
                    context.entries.pieces = index - 1
                  }),
                index === 0,
              ),
              button(
                t('definitions.movePieceDown', { id: piece.id }),
                () =>
                  change(() => {
                    moveDefinitionEntry(part.pieces, index, 1)
                    context.entries.pieces = index + 1
                  }),
                index === part.pieces.length - 1,
              ),
              button(t('definitions.removePiece', { id: piece.id }), () =>
                change(() => {
                  part.pieces.splice(index, 1)
                }),
              ),
            ),
            'pieces',
            index,
          ),
        { path: ['pieces'] },
      ),
      fieldPath(
        input(t('definitions.newPieceId'), pending.piece, (value) => {
          pending.piece = value.trim()
        }),
        'pieces',
      ),
      button(
        t('definitions.addPiece'),
        () =>
          change(() => {
            requireDefinitionId(
              pending.piece,
              part.pieces.map((piece) => piece.id),
              t,
            )
            const image = Object.keys(catalog.images)[0]

            if (!image) throw new Error(t('definitions.imageFirst'))
            context.entries.pieces = part.pieces.length
            part.pieces.push(partPieceSchema.parse({ id: pending.piece, image, layer: 'body' }))
            pending.piece = ''
          }),
        !Object.keys(catalog.images).length,
      ),
    ),
    controls.section('bounds', fieldPath(boundsForm(context, part), 'bounds')),
    ...partColorsForm(context, part),
  ]
}
