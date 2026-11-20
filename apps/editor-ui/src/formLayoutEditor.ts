import type { ProjectView } from '@ancadeba/editor-core'
import type { FormDefinition, FormElement } from '@ancadeba/schemas'
import { elementName, formKinds, newFormElement } from './formElements.js'
import type { RuleFormControls } from './ruleFormControls.js'
import type { ConfirmAction } from './editorConfirmation.js'

export interface FormElementPicker {
  kind: FormElement['type']
}

export interface FormSelection {
  row: number
  column: number
  element: number
  option: number
}

export function firstFormSelection(form?: FormDefinition): FormSelection {
  const selection = { row: 0, column: 0, element: 0, option: 0 }
  const locations = form ? formLocations(form) : []

  const first =
    locations.find((e) => e.field && e.field.type !== 'graphic' && e.field.type !== 'portrait') ??
    locations.find((e) => e.field)

  if (first)
    Object.assign(selection, { row: first.row, column: first.column, element: first.element })

  return selection
}

function formLocations(form: FormDefinition) {
  return form.rows.flatMap((row, r) =>
    (row.length ? row : [[]]).flatMap((column, col) =>
      (column.length ? column : [undefined]).map((field, e) => ({
        row: r,
        column: col,
        element: e,
        field,
      })),
    ),
  )
}

export function formLayoutEditor(
  c: RuleFormControls,
  view: ProjectView,
  form: FormDefinition,
  selection: FormSelection,
  adding: FormElementPicker,
  redraw: (focus?: string) => void,
  confirm: ConfirmAction | undefined,
  isCurrent: () => boolean,
) {
  const { t, create } = c
  const locations = formLocations(form)
  const row = form.rows[selection.row]
  const column = row?.[selection.column]
  const element = column?.[selection.element]

  const current = locations.findIndex(
    (x) =>
      x.row === selection.row && x.column === selection.column && x.element === selection.element,
  )

  const outline = create('div')
  outline.className = 'form-outline'
  outline.setAttribute('role', 'group')
  outline.setAttribute('aria-label', t('forms.elements'))

  function selectAt(index: number) {
    const next = locations[index]

    if (!next) return
    Object.assign(selection, {
      row: next.row,
      column: next.column,
      element: next.element,
      option: 0,
    })
    redraw('entry')
  }

  const name = (i: number) => {
    const field = locations[i]!.field

    return field ? elementName(view, t, field) : t('forms.empty')
  }

  const address = (r: number, col: number) => t('forms.location', { row: r + 1, column: col + 1 })

  const picker = c.select(
    t('forms.selectedElement'),
    String(current),
    locations.map((loc, i) => [String(i), address(loc.row, loc.column) + ' · ' + name(i)] as const),
    (v) => selectAt(Number(v)),
    false,
  )

  picker.className = 'form-element-picker'

  const buttons = locations.map((loc, i) => {
    if (!i || locations[i - 1]!.row !== loc.row || locations[i - 1]!.column !== loc.column) {
      const heading = create('strong')
      heading.textContent = address(loc.row, loc.column)
      outline.append(heading)
    }

    const button = c.button(name(i), () => selectAt(i))
    button.setAttribute('aria-pressed', String(i === current))
    outline.append(button)

    return button
  })

  function updateName() {
    if (current < 0) return
    buttons[current]!.textContent = name(current)
    const option = picker.querySelector('select')?.options?.[current]

    if (option)
      option.textContent = address(selection.row, selection.column) + ' · ' + name(current)
  }

  function changed() {
    selection.option = 0
    c.markEdited()
    redraw('entry')
  }

  const kindPicker = c.select(
    t('forms.element'),
    adding.kind,
    formKinds.map((k) => [k, t(`forms.${k}`)] as const),
    (k) => {
      adding.kind = k
    },
    false,
  )

  const add = c.button(
    t(locations.some((loc) => loc.field) ? 'forms.addElement' : 'forms.firstElement'),
    () => {
      if (!row) form.rows.push([])
      const targetRow = form.rows[selection.row]!

      if (!column) targetRow.push([])
      const targetColumn = targetRow[selection.column]!
      selection.element = targetColumn.push(newFormElement(view, adding.kind, t)) - 1
      changed()
    },
  )

  add.setAttribute('data-form-control', 'first')
  const addTools = c.group(t('forms.addElement'), kindPicker, add)
  const actions = create('div')
  actions.className = 'form-structure'

  const addRow = c.button(t('forms.addRow'), () => {
    selection.row = form.rows.push([[]]) - 1
    selection.column = selection.element = 0
    changed()
  })

  const appendColumn = c.button(t('forms.addColumn'), () => {
    if (!row) return
    selection.column = row.push([]) - 1
    selection.element = 0
    changed()
  })

  function move<T>(items: T[], index: number, step: number, setIndex: (value: number) => void) {
    const [item] = items.splice(index, 1)
    items.splice(index + step, 0, item!)
    setIndex(index + step)
    c.markEdited()
    redraw('entry')
  }

  function order<T>(items: T[], index: number, setIndex: (v: number) => void, horizontal = false) {
    return [
      c.button(
        t(horizontal ? 'forms.left' : 'rules.moveUp'),
        () => move(items, index, -1, setIndex),
        index <= 0,
      ),
      c.button(
        t(horizontal ? 'forms.right' : 'rules.moveDown'),
        () => move(items, index, 1, setIndex),
        index >= items.length - 1,
      ),
    ]
  }

  function selectNeighbor(firstRemoved: number) {
    const remaining = formLocations(form)

    const next =
      remaining.slice(firstRemoved).find((entry) => entry.field) ??
      remaining
        .slice(0, firstRemoved)
        .reverse()
        .find((entry) => entry.field) ??
      remaining[Math.min(firstRemoved, remaining.length - 1)]

    Object.assign(
      selection,
      next ? { row: next.row, column: next.column, element: next.element } : firstFormSelection(),
    )
    changed()
  }

  async function removeGroup(level: 'row' | 'column') {
    if (!row) return
    const rowIndex = selection.row
    const columnIndex = selection.column

    const firstRemoved = locations.findIndex(
      (entry) => entry.row === rowIndex && (level === 'row' || entry.column === columnIndex),
    )

    const contents = level === 'row' ? row.flat() : (column ?? [])

    if (contents.length) {
      const names = contents.map((e) => elementName(view, t, e)).join(', ')

      const accepted = await confirm?.(
        t(level === 'row' ? 'forms.confirmRow' : 'forms.confirmColumn', { entries: names }),
        level === 'row' ? 'forms.removeRow' : 'forms.removeColumn',
      )

      if (!accepted || !isCurrent() || form.rows[rowIndex] !== row || row[columnIndex] !== column)
        return
    }

    if (level === 'row') form.rows.splice(rowIndex, 1)
    else row.splice(columnIndex, 1)
    selectNeighbor(firstRemoved)
  }

  if (element && column) {
    const destinations = form.rows.flatMap((r, i) =>
      r.map((_, j) => [i + '/' + j, address(i, j)] as const),
    )

    actions.append(
      c.group(
        t('forms.selectedElement'),
        ...order(column, selection.element, (i) => {
          selection.element = i
        }),
        c.button(t('forms.removeElement'), () => {
          column.splice(selection.element, 1)
          selectNeighbor(current)
        }),
        c.select(
          t('forms.position'),
          selection.row + '/' + selection.column,
          destinations,
          (key) => {
            const [r, col] = key.split('/').map(Number)
            column.splice(selection.element, 1)
            selection.row = r!
            selection.column = col!
            selection.element = form.rows[r!]![col!]!.push(element) - 1
            c.markEdited()
            redraw('entry')
          },
          false,
        ),
      ),
    )
  }

  if (row)
    actions.append(
      c.group(
        t('forms.row') + ' ' + (selection.row + 1),
        ...order(form.rows, selection.row, (i) => {
          selection.row = i
        }),
        addRow,
        c.button(t('forms.removeRow'), () => {
          void removeGroup('row')
        }),
      ),
    )

  if (column && row)
    actions.append(
      c.group(
        t('forms.column') + ' ' + (selection.column + 1),
        ...order(
          row,
          selection.column,
          (i) => {
            selection.column = i
          },
          true,
        ),
        appendColumn,
        c.button(t('forms.removeColumn'), () => {
          void removeGroup('column')
        }),
      ),
    )
  else if (row) actions.append(appendColumn)

  return { outline, picker, updateName, addTools, actions }
}
