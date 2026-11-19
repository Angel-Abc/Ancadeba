import type { Translate } from '@ancadeba/utilities'
import { editorLocalization } from './localization.js'
import { gameIdSchema, inputSchema, type InputDefinition } from '@ancadeba/schemas'
import type { RuleFormControls } from './ruleFormControls.js'
import { entryEditor, type EntrySelections } from './specialistEntries.js'

export interface InputSelection {
  view: 'keyboard' | 'contexts' | 'keys'
  context: string
  entries: EntrySelections
}

class BindingError extends Error {
  constructor(
    message: string,
    readonly path: readonly PropertyKey[],
    readonly invalidMappingKey = false,
  ) {
    super(message)
  }
}

export interface InputDraft {
  virtualKeys: string
  keyboard: { code: string; key: string }[]
  contexts: Record<string, { key: string; input: string }[]>
  initialContext: string
  newContext: string
}

export function createInputDraft(input: InputDefinition): InputDraft {
  return {
    virtualKeys: input['virtual-keys'].join(', '),
    keyboard: Object.entries(input.keyboard).map(([code, key]) => ({ code, key })),
    contexts: Object.fromEntries(
      Object.entries(input.contexts).map(([id, mappings]) => [
        id,
        Object.entries(mappings).map(([key, input]) => ({ key, input })),
      ]),
    ),
    initialContext: input['initial-context'],
    newContext: '',
  }
}

function uniqueMappings(
  entries: [string, string][],
  name: string,
  t: Translate,
  path: string[],
): Record<string, string> {
  const seen = new Set<string>()

  for (const [key] of entries) {
    if (seen.has(key))
      throw new BindingError(t('controls.duplicateKeys', { name }), [...path, key], true)
    seen.add(key)
  }

  return Object.fromEntries(entries)
}

export function readInputDraft(
  draft: InputDraft,
  t: Translate = editorLocalization().t,
): InputDefinition {
  if (draft.newContext) throw new BindingError(t('controls.pendingContext'), ['newContext'])

  const input = {
    'schema-version': '1.0.0',
    'virtual-keys': draft.virtualKeys
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean),
    keyboard: uniqueMappings(
      draft.keyboard.map(({ code, key }) => [code, key]),
      t('controls.keyboard'),
      t,
      ['keyboard'],
    ),
    contexts: Object.fromEntries(
      Object.entries(draft.contexts).map(([id, mappings]) => [
        id,
        uniqueMappings(
          mappings.map(({ key, input }) => [key, input]),
          t('controls.context', { id }),
          t,
          ['contexts', id],
        ),
      ]),
    ),
    'initial-context': draft.initialContext,
  }

  const parsed = inputSchema.safeParse(input)

  if (!parsed.success) {
    const issue = parsed.error.issues[0]!
    throw new BindingError(issue.message, issue.path, issue.code === 'invalid_key')
  }

  return parsed.data
}

export function inputDefinitionForm(
  controls: RuleFormControls,
  draft: InputDraft,
  selection: InputSelection,
  edited: () => void,
  reportError: (message: string) => void,
) {
  const { create, input, select, button, group, t } = controls
  const root = create('div')
  const nav = create('div')
  nav.className = 'specialist-views'
  const body = create('div')
  root.append(nav, body)

  const keys = () =>
    draft.virtualKeys
      .split(',')
      .map((key) => key.trim())
      .filter(Boolean)

  const contextKey = () => 'context:' + selection.context
  let focusFields: Record<string, HTMLElement> = {}

  const field = (key: string, control: HTMLElement) => {
    focusFields[key] = control

    return control
  }

  const focus = (key: string) => {
    const wrapper = focusFields[key]

    const target =
      wrapper?.querySelector<HTMLElement>('input') ??
      wrapper?.querySelector<HTMLElement>('select') ??
      wrapper

    target?.focus?.()
  }

  const update = (operation: () => void) => {
    operation()
    edited()
    render()
  }

  const views = [
    ['keyboard', 'controls.keyboardMappings'],
    ['contexts', 'controls.inputContexts'],
    ['keys', 'controls.virtualKeysView'],
  ] as const

  const buttons = views.map(([id, label]) =>
    button(t(label), () => {
      selection.view = id
      render()
    }),
  )

  nav.append(...buttons)

  function render() {
    views.forEach(([id], index) =>
      buttons[index]!.setAttribute('aria-pressed', String(selection.view === id)),
    )
    body.replaceChildren()
    focusFields = {}

    if (selection.view === 'keys') {
      body.append(
        field(
          'keys',
          input(t('controls.virtualKeys'), draft.virtualKeys, (value) => {
            draft.virtualKeys = value
          }),
        ),
      )

      return
    }

    if (selection.view === 'keyboard') {
      const entries = draft.keyboard
      body.append(
        entryEditor(
          controls,
          selection.entries,
          'keyboard',
          t('controls.keyboardMappingPicker'),
          entries,
          (row, index) =>
            row.code
              ? row.code + ' → ' + row.key
              : t('controls.keyboardMapping', { number: index + 1 }),
          (row, index) =>
            group(
              t('controls.keyboardMapping', { number: index + 1 }),
              field(
                'code',
                input(t('controls.keyCode'), row.code, (value) => {
                  row.code = value.trim()
                }),
              ),
              field(
                'key',
                select(t('controls.virtualKey'), row.key, keys(), (value) => {
                  row.key = value
                }),
              ),
              button(t('controls.removeKeyMapping'), () => {
                update(() => {
                  entries.splice(index, 1)
                })
                focus(entries.length ? 'code' : 'addMapping')
              }),
            ),
        ),
        field(
          'addMapping',
          button(t('controls.addKeyMapping'), () => {
            update(() => {
              selection.entries.keyboard = entries.push({ code: '', key: keys()[0] ?? '' }) - 1
            })
            focus('code')
          }),
        ),
      )

      return
    }

    const ids = Object.keys(draft.contexts)

    if (!ids.includes(selection.context)) selection.context = draft.initialContext
    const context = selection.context
    const mappings = draft.contexts[context] ?? []
    body.append(
      field(
        'context',
        select(
          t('controls.editContext'),
          context,
          ids,
          (value) => {
            selection.context = value
            render()
            focus('context')
          },
          false,
        ),
      ),
    )

    body.append(
      entryEditor(
        controls,
        selection.entries,
        contextKey(),
        t('controls.contextMappingPicker'),
        mappings,
        (row, index) =>
          row.input
            ? row.key + ' → ' + row.input
            : t('controls.contextMapping', { number: index + 1 }),
        (row, index) =>
          group(
            t('controls.contextMapping', { number: index + 1 }),
            field(
              'key',
              select(t('controls.virtualKey'), row.key, keys(), (value) => {
                row.key = value
              }),
            ),
            field(
              'input',
              input(t('controls.virtualInputId'), row.input, (value) => {
                row.input = value.trim()
              }),
            ),
            button(t('controls.removeContextMapping'), () => {
              update(() => {
                mappings.splice(index, 1)
              })
              focus(mappings.length ? 'input' : 'addMapping')
            }),
          ),
      ),
      field(
        'addMapping',
        button(t('controls.addContextMapping'), () => {
          update(() => {
            selection.entries[contextKey()] = mappings.push({ key: keys()[0] ?? '', input: '' }) - 1
          })
          focus('input')
        }),
      ),
      field(
        'initial',
        select(t('controls.initialContext'), draft.initialContext, ids, (value) => {
          draft.initialContext = value
        }),
      ),
      button(
        t('controls.removeContext'),
        () => {
          update(() => {
            delete draft.contexts[context]
            delete selection.entries[contextKey()]
            selection.context = Object.keys(draft.contexts)[0] ?? ''

            if (draft.initialContext === context) draft.initialContext = selection.context
          })
          focus('context')
        },
        ids.length < 2,
      ),
      field(
        'newContext',
        input(t('controls.newContextId'), draft.newContext, (value) => {
          draft.newContext = value.trim()
        }),
      ),
      button(t('controls.addContext'), () => {
        if (
          !gameIdSchema.safeParse(draft.newContext).success ||
          Object.hasOwn(draft.contexts, draft.newContext)
        ) {
          reportError(t('controls.invalidContextId'))
          focus('newContext')

          return
        }

        update(() => {
          draft.contexts = { ...draft.contexts, [draft.newContext]: [] }
          selection.context = draft.newContext
          draft.newContext = ''
        })
        focus('addMapping')
      }),
    )
  }

  render()

  return {
    element: root,
    reveal(failure: unknown) {
      if (!(failure instanceof BindingError)) return
      const [scope, id, key] = failure.path.map(String)
      let target = 'keys'

      if (scope === 'keyboard') {
        selection.view = 'keyboard'
        const index = selection.entries.keyboard ?? 0

        if (draft.keyboard[index]?.code !== id)
          selection.entries.keyboard = draft.keyboard.findIndex((row) => row.code === id)
        target = failure.invalidMappingKey || !id ? 'code' : 'key'
      } else if (scope === 'contexts' || scope === 'initial-context' || scope === 'newContext') {
        selection.view = 'contexts'

        if (id && Object.hasOwn(draft.contexts, id)) selection.context = id
        const mappings = draft.contexts[selection.context] ?? []

        if (key !== undefined && mappings[selection.entries[contextKey()] ?? 0]?.key !== key)
          selection.entries[contextKey()] = mappings.findIndex((row) => row.key === key)
        target =
          scope === 'newContext'
            ? 'newContext'
            : scope === 'initial-context'
              ? 'initial'
              : !mappings.length
                ? 'addMapping'
                : !keys().includes(key ?? '') || failure.invalidMappingKey
                  ? 'key'
                  : 'input'
      } else selection.view = 'keys'
      render()
      focus(target)
    },
  }
}
