import type { Translate } from '@ancadeba/utilities'
import type { MapDraft } from './mapDraft.js'
import type { TilesetEditorState } from './mapTilesetEditor.js'
import type { RuleFormControls } from './ruleFormControls.js'

export interface MapTerrainEditorState {
  selected: string
  newId: string
}

export function mapTerrainEditor(
  document: Document,
  draft: MapDraft,
  controls: RuleFormControls,
  t: Translate,
  state: MapTerrainEditorState,
  tilesets: TilesetEditorState,
  render: () => void,
  change: (operation: () => void) => void,
  repaint: () => void,
  removed: (id: string, replacement: string) => void,
) {
  let tileChoice: HTMLSelectElement | undefined
  const terrain = document.createElement('fieldset')
  const legend = document.createElement('legend')
  legend.textContent = t('maps.terrainSettings', { terrain: state.selected })
  terrain.append(
    legend,
    controls.select(
      t('maps.terrainToEdit'),
      state.selected,
      Object.keys(draft.data.terrain),
      (value) => {
        state.selected = value
        const tile = draft.data.terrain[value]?.tile

        if (tile)
          Object.assign(tilesets, { selected: tile.tileset, column: tile.column, row: tile.row })
        render()
      },
      false,
    ),
  )
  const definition = draft.data.terrain[state.selected]

  if (!definition) legend.textContent = t('maps.terrain')

  if (definition) {
    terrain.append(
      controls.select(
        t('maps.baseColor'),
        definition.color ? 'yes' : 'no',
        [
          ['yes', t('maps.yes')],
          ['no', t('maps.no')],
        ],
        (value) =>
          change(() => {
            if (value === 'yes') definition.color ??= '#608c4f'
            else delete definition.color
          }),
      ),
    )
    terrain.append(
      controls.input(
        t('maps.color'),
        definition.color ?? '#608c4f',
        (value) => {
          definition.color = value
          repaint()
        },
        'color',
      ),
      controls.select(
        t('maps.walkable'),
        definition.walkable === false ? 'no' : 'yes',
        [
          ['yes', t('maps.yes')],
          ['no', t('maps.no')],
        ],
        (value) => {
          definition.walkable = value === 'yes'
          repaint()
        },
      ),
      controls.input(
        t('maps.cost'),
        String(definition.movementCostMs ?? 0),
        (value) => {
          definition.movementCostMs = Number(value)
        },
        'number',
      ),
    )

    const colorInput = terrain.querySelector('input')!
    colorInput.disabled = definition.color === undefined

    const tileField = controls.select(
      t('maps.tileImage'),
      definition.tile?.tileset ?? '',
      [
        ['', t('maps.noImage')],
        ...Object.keys(draft.data.tilesets ?? {}).map((id) => [id, id] as const),
      ],
      (value) =>
        change(() => {
          if (!value) {
            delete definition.tile
            definition.color ??= '#608c4f'
          } else {
            definition.tile = { tileset: value, column: 0, row: 0 }
            tilesets.selected = value
          }
        }),
    )

    tileChoice = tileField.querySelector('select')!
    terrain.append(tileField)

    const alternatives = Object.keys(draft.data.terrain).filter(
      (terrainId) => terrainId !== state.selected,
    )

    let replacement = alternatives[0] ?? ''
    terrain.append(
      controls.select(
        t('maps.replacement'),
        replacement,
        alternatives,
        (value) => {
          replacement = value
        },
        false,
      ),
      controls.button(
        t('maps.removeTerrain'),
        () =>
          change(() => {
            draft.removeTerrain(state.selected, replacement)
            removed(state.selected, replacement)
            state.selected = replacement || Object.keys(draft.data.terrain)[0]!
          }),
        alternatives.length === 0,
      ),
    )
  }

  terrain.append(
    controls.input(t('maps.newTerrain'), state.newId, (value) => {
      state.newId = value.trim()
    }),
    controls.button(t('maps.addTerrain'), () =>
      change(() => {
        draft.addTerrain(state.newId)
        state.selected = state.newId
        state.newId = ''
      }),
    ),
  )

  return {
    element: terrain,
    refresh: () => {
      if (tileChoice) tileChoice.value = draft.data.terrain[state.selected]?.tile?.tileset ?? ''
    },
  }
}
