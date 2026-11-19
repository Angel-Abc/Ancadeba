import type { RuleFormControls } from './ruleFormControls.js'

export type EntrySelections = Record<string, number>

type FieldPath = readonly PropertyKey[]

const revealCollection = new WeakMap<Element, (path: FieldPath) => boolean>()

/** The compact picker and the wide outline share one selection and one mounted entry form. */
export function entryEditor<T>(
  controls: RuleFormControls,
  selections: EntrySelections,
  key: string,
  title: string,
  entries: readonly T[],
  name: (entry: T, index: number) => string,
  details: (entry: T, index: number) => HTMLElement,
  options: { initial?: number; path?: FieldPath; ids?: readonly string[] } = {},
) {
  const { create } = controls
  const root = create('div')
  root.className = 'specialist-entries'
  root.setAttribute('data-entry-key', key)

  if (!entries.length) return root

  const outline = create('div')
  outline.className = 'entry-outline'
  outline.setAttribute('role', 'group')
  outline.setAttribute('aria-label', title)
  const body = create('div')
  body.className = 'entry-fields'
  const picker = create('select')
  const label = create('label')
  label.className = 'entry-picker'
  label.append(title, picker)

  const select = (index: number) => {
    selections[key] = index
    picker.value = String(index)
    buttons.forEach(({ button }, position) =>
      button.setAttribute('aria-pressed', String(position === index)),
    )
    body.replaceChildren(details(entries[index]!, index))
  }

  const buttons = entries.map((entry, index) => {
    const caption = name(entry, index)
    const button = controls.button(caption, () => select(index))
    const option = create('option')
    option.value = String(index)
    option.textContent = caption
    picker.append(option)
    outline.append(button)

    return { button, option }
  })

  const refresh = () => {
    const index = selections[key]!
    const caption = name(entries[index]!, index)
    buttons[index]!.option.textContent = caption
    buttons[index]!.button.textContent = caption
  }

  body.addEventListener('input', refresh)
  body.addEventListener('change', refresh)
  picker.addEventListener('change', () => select(Number(picker.value)))
  const layout = create('div')
  layout.className = 'entry-layout'
  layout.append(label, outline, body)
  root.append(layout)
  select(Math.max(0, Math.min(selections[key] ?? options.initial ?? 0, entries.length - 1)))
  const prefix = options.path

  if (prefix)
    revealCollection.set(root, (path) => {
      if (!prefix.every((part, index) => part === path[index])) return false
      const part = path[prefix.length]
      const index = options.ids ? options.ids.indexOf(String(part)) : Number(part)

      if (!Number.isInteger(index) || index < 0 || index >= entries.length) return false

      if (selections[key] !== index) select(index)

      return true
    })

  return root
}

/** Structural edits rebuild the form. Keep keyboard users in the collection they were editing. */
export function rememberEntryFocus(root: HTMLElement) {
  const active = root.ownerDocument.activeElement
  const key = active?.closest('[data-entry-key]')?.getAttribute('data-entry-key')

  if (!key || !root.contains(active)) return

  return () => {
    const entry = Array.from(root.querySelectorAll<HTMLElement>('[data-entry-key]')).find(
      (element) => element.getAttribute('data-entry-key') === key,
    )

    const picker = entry?.querySelector<HTMLSelectElement>('.entry-picker select')
    const selected = entry?.querySelector<HTMLButtonElement>('.entry-outline [aria-pressed="true"]')

    if (picker?.getClientRects().length) picker.focus()
    else selected?.focus()
  }
}

export function fieldPath<T extends HTMLElement>(field: T, ...path: PropertyKey[]): T {
  field.setAttribute('data-model-path', JSON.stringify(path))

  return field
}

/** Resolve outer collections first, since their selection mounts the inner pickers and fields. */
export function focusIssue(root: HTMLElement, path: FieldPath) {
  function reveal(parent: Element) {
    for (const child of Array.from(parent.children)) {
      revealCollection.get(child)?.(path)
      reveal(child)
    }
  }

  reveal(root)
  let target: HTMLElement | undefined

  for (let length = path.length; length && !target; length--) {
    const prefix = JSON.stringify(path.slice(0, length))
    target = Array.from(root.querySelectorAll<HTMLElement>('[data-model-path]')).find(
      (field) => field.getAttribute?.('data-model-path') === prefix,
    )
  }

  const input =
    target?.querySelector<HTMLElement>('input:not([readonly]), select, textarea') ??
    target?.querySelector<HTMLElement>('button, summary')

  for (let parent = input?.parentElement; parent; parent = parent.parentElement)
    if (parent instanceof HTMLDetailsElement) parent.open = true
  input?.focus()
}
