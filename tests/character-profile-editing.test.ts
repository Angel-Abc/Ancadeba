import { describe, expect, it } from 'vite-plus/test'
import { object, applyCommand, validateProject, type ProjectSnapshot } from '@ancadeba/editor-core'
import {
  choiceSchema,
  formField,
  formSchema,
  gameRulesSchema,
  type StatusRowDefinition,
} from '@ancadeba/schemas'

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
        choices: ['appearance'],
        characterProfile: {
          fields: ['appearance'],
          portrait: { visual: 'portrait' },
        },
      },
      'choices/appearance.json': {
        'schema-version': '1.0.0',
        id: 'appearance',
        label: 'Appearance',
        path: ['character'],
        options: [{ id: 'default', label: 'Default' }],
        default: 'default',
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

describe('shared choices', () => {
  const form = (id: string, choice: string) =>
    formSchema.parse({
      'schema-version': '1.0.0',
      id,
      label: id,
      rows: [[[{ type: 'choice', choice }]]],
    })

  it('resolves a single edited definition on two forms and identifies all uses before removal', () => {
    let source = project([])

    for (const id of ['creator', 'wardrobe']) {
      source = applyCommand(source, {
        type: 'game.upsertForm',
        form: form(id, 'appearance'),
      }).project
    }

    const choice = choiceSchema.parse(source.documents['choices/appearance.json'])

    const result = applyCommand(source, {
      type: 'game.upsertChoice',
      choice: { ...choice, label: 'Hair color' },
    })

    expect(result.changedFiles).toEqual(['choices/appearance.json'])

    const choices = new Map([
      [choice.id, choiceSchema.parse(result.project.documents['choices/appearance.json'])],
    ])

    for (const id of ['creator', 'wardrobe']) {
      const saved = formSchema.parse(result.project.documents['forms/' + id + '.json'])
      expect(formField(saved.rows[0]![0]![0]!, choices)).toMatchObject({
        label: 'Hair color',
        path: ['character'],
      })
    }

    expect(() =>
      applyCommand(result.project, { type: 'game.removeChoice', choiceId: 'appearance' }),
    ).toThrow(/creator.*wardrobe.*character profile/)
    const unused = { ...choice, id: 'unused' }

    const added = applyCommand(result.project, {
      type: 'game.upsertChoice',
      choice: unused,
    }).project

    const removed = applyCommand(added, { type: 'game.removeChoice', choiceId: unused.id })
    expect(removed.removedFiles).toEqual(['choices/unused.json'])
    expect(removed.project.documents['game.json']).toEqual(result.project.documents['game.json'])
  })

  it('rejects missing references, repeated state bindings, and invalid option IDs', () => {
    const source = project([])
    const choice = choiceSchema.parse(source.documents['choices/appearance.json'])
    const bad = form('bad', 'missing')
    expect(() => applyCommand(source, { type: 'game.upsertForm', form: bad })).toThrow(
      expect.objectContaining({
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'invalid_form' })]),
      }),
    )
    const duplicate = form('duplicate', 'appearance')
    duplicate.rows[0]![0]!.push({ type: 'text', label: 'Other', path: choice.path, default: '' })
    expect(() => applyCommand(source, { type: 'game.upsertForm', form: duplicate })).toThrow(
      expect.objectContaining({
        diagnostics: expect.arrayContaining([
          expect.objectContaining({ message: 'A form can edit a state path only once' }),
        ]),
      }),
    )
    expect(
      choiceSchema.safeParse({ ...choice, options: [...choice.options, ...choice.options] })
        .success,
    ).toBe(false)
    expect(choiceSchema.safeParse({ ...choice, default: 'missing' }).success).toBe(false)
    expect(() =>
      applyCommand(source, {
        type: 'game.upsertChoice',
        choice: { ...choice, options: [{ id: 'other', label: 'Other' }], default: 'other' },
      }),
    ).toThrow(
      expect.objectContaining({
        diagnostics: expect.arrayContaining([expect.objectContaining({ code: 'invalid_choice' })]),
      }),
    )
    const manifest = { ...object(source.documents['game.json']), choices: [] }
    expect(validateProject({ ...source.documents, 'game.json': manifest })).toContainEqual(
      expect.objectContaining({
        code: 'invalid_character_profile',
        path: ['characterProfile', 'fields', 0],
      }),
    )
  })
})

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
