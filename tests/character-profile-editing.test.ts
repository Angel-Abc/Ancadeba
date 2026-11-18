import { describe, expect, it } from 'vite-plus/test'
import { applyCommand, validateProject, type ProjectSnapshot } from '@ancadeba/editor-core'
import { gameRulesSchema, type StatusRowDefinition } from '@ancadeba/schemas'

const rules = gameRulesSchema.parse({
  state: [
    { path: ['character'], value: 'default' },
    { path: ['health'], type: 'number', value: 40 },
    { path: ['maximum'], type: 'number', value: 50 },
    { path: ['visible'], value: true },
  ],
  actions: {},
})

const rows: StatusRowDefinition[] = [
  {
    id: 'health',
    type: 'bar',
    label: 'Health',
    value: { source: 'game.state', path: ['health'] },
    maximum: { source: 'game.state', path: ['maximum'] },
    visibleWhen: { source: 'game.state', path: ['visible'] },
  },
]

function project(statRows: StatusRowDefinition[]): ProjectSnapshot {
  return {
    revision: 'original',
    documents: {
      'game.json': {
        'schema-version': '1.0.0',
        id: 'character',
        title: 'Character',
        version: '1',
        scenes: ['sheet'],
        rules: ['state'],
        assets: 'art',
        characterProfile: {
          fields: [
            {
              id: 'appearance',
              label: 'Appearance',
              path: ['character'],
              options: [{ id: 'default', label: 'Default' }],
              default: 'default',
            },
          ],
          portrait: { visual: 'portrait' },
        },
      },
      'assets/art.json': {
        'schema-version': '1.0.0',
        images: {
          portrait: {
            format: 'svg',
            source: 'assets/portrait.svg',
            bounds: { x: 0, y: 0, width: 10, height: 10 },
          },
        },
      },
      'scenes/sheet.json': {
        'schema-version': '1.0.0',
        id: 'sheet',
        title: 'Character',
        type: 'stand-alone',
        screen: { type: 'grid', grid: { rows: 3, columns: 3 } },
        components: [
          {
            id: 'character',
            type: 'character-sheet',
            placement: { row: 1, column: 1 },
            rows: statRows,
          },
        ],
      },
      'rules/state.json': rules,
    },
  }
}

describe('Rules editing with a character sheet', () => {
  it('preserves authored row and binding extensions across relabel, reorder, change of type and removal', () => {
    const value = { source: 'game.state' as const, path: ['health'] }

    const bar = {
      ...rows[0]!,
      type: 'bar' as const,
      value: { ...value, fallback: '40', units: 'hp' },
      maximum: { ...value, path: ['maximum'], units: 'hp' },
      color: '#ff0000',
      designerNote: 'first',
      visibleWhen: { ...value, path: ['visible'], extra: true },
    }

    const stat = {
      id: 'stat',
      type: 'value' as const,
      label: 'Statistic',
      value: 'text',
      designerNote: 'second',
    }

    const original = project([bar, stat, { ...stat, id: 'removed' }])

    const save = (snapshot: ProjectSnapshot, nextRows: StatusRowDefinition[]) =>
      applyCommand(snapshot, {
        type: 'scene.upsertComponent',
        sceneId: 'sheet',
        component: {
          id: 'character',
          type: 'character-sheet',
          label: 'Character',
          placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 },
          rows: nextRows,
        },
      }).project

    const readRows = (snapshot: ProjectSnapshot) =>
      JSON.parse(JSON.stringify(snapshot.documents['scenes/sheet.json'])).components[0].rows

    const updated = save(original, [
      { ...stat, label: 'Updated' },
      { ...bar, label: 'HP', value },
    ])

    expect(readRows(updated)).toEqual([
      { ...stat, label: 'Updated' },
      { ...bar, label: 'HP', value: { ...value, units: 'hp' } },
    ])
    const changed = save(updated, [{ id: bar.id, type: 'value', label: 'Health', value: 5 }])
    expect(readRows(changed)).toEqual([
      { id: bar.id, type: 'value', label: 'Health', value: 5, designerNote: 'first' },
    ])
  })

  it.each([{ statRows: [] }, { statRows: rows }])(
    'saves unchanged and updated Rules with $statRows',
    ({ statRows }) => {
      const original = project(statRows)
      const before = JSON.stringify(original)
      expect(validateProject(original.documents)).toEqual([])

      const unchanged = applyCommand(original, {
        type: 'game.updateRules',
        ruleId: 'state',
        rules,
      })

      const next = gameRulesSchema.parse({
        ...rules,
        state: [...rules.state, { path: ['unrelated'], value: false }],
      })

      const updated = applyCommand(unchanged.project, {
        type: 'game.updateRules',
        ruleId: 'state',
        rules: next,
      })

      expect(updated.changedFiles).toEqual(['rules/state.json'])
      expect(updated.project.documents['rules/state.json']).toEqual(next)
      expect(updated.project.documents['scenes/sheet.json']).toEqual(
        original.documents['scenes/sheet.json'],
      )
      expect(JSON.stringify(original)).toBe(before)
    },
  )

  it.each(['health', 'maximum', 'visible'])(
    'protects the sheet binding to %s from removal and incompatible types',
    (path) => {
      const original = project(rows)
      const before = JSON.stringify(original)
      const without = rules.state.filter((field) => field.path[0] !== path)

      const retyped = rules.state.map((field) =>
        field.path[0] === path ? { path: field.path, value: 'wrong' } : field,
      )

      for (const state of [without, retyped])
        expect(() =>
          applyCommand(original, {
            type: 'game.updateRules',
            ruleId: 'state',
            rules: gameRulesSchema.parse({ ...rules, state }),
          }),
        ).toThrow(expect.objectContaining({ code: 'status_binding_in_use' }))

      expect(JSON.stringify(original)).toBe(before)
    },
  )
})
