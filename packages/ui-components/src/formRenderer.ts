import {
  formField,
  type FormDefinition,
  type CharacterProfileDefinition,
  type FormField,
  type FormValue,
} from '@ancadeba/schemas'
import {
  runtimeText,
  type GameData,
  type IGameBindings,
  type SceneComponentData,
} from '@ancadeba/game-runtime'
import type { ComponentRenderContext, RenderedComponent } from './componentRendering.js'
import { GraphicComponentRenderer } from './graphicComponentRenderer.js'

export interface FormDraft {
  values: Map<string, FormValue>
  submitted: boolean
}

type Placement = Extract<SceneComponentData, { type: 'form' }>

function fieldControl(
  document: Document,
  field: FormField,
  name: string,
  value: FormValue,
  update: (value: FormValue) => void,
) {
  const label = document.createElement('label')
  label.textContent = field.label

  if (field.type === 'choice') {
    const select = document.createElement('select')
    select.name = name

    for (const choice of field.options) {
      const option = document.createElement('option')
      option.value = choice.id
      option.textContent = choice.label
      select.append(option)
    }

    select.value = String(value)
    select.addEventListener('change', () => update(select.value))
    label.append(select)
  } else {
    const input = document.createElement('input')
    input.name = name
    input.type = field.type

    if (field.type === 'checkbox') input.checked = value === true
    else input.value = String(value)

    if (field.type === 'number') {
      input.step = 'any'
      input.required = true
    }

    input.addEventListener(field.type === 'checkbox' ? 'change' : 'input', () =>
      update(
        field.type === 'checkbox'
          ? input.checked
          : field.type === 'number' && input.value !== ''
            ? Number(input.value)
            : input.value,
      ),
    )
    label.append(input)
  }

  return label
}

export function renderForm(
  component: Placement,
  definition: FormDefinition,
  profile: CharacterProfileDefinition | undefined,
  context: ComponentRenderContext,
  defaults: Pick<GameData, 'rules' | 'ruleTranslation' | 'choices'> | undefined = context.game,
): RenderedComponent {
  const choices = context.localization?.current.choices ?? defaults?.choices
  const { document, scene, submitForm } = context
  const form = document.createElement('form')
  form.className = 'ancadeba-form'
  form.setAttribute('aria-label', component.label)
  const heading = document.createElement('h2')
  heading.textContent = component.label
  form.append(heading)

  const draft = context.formDrafts?.get(component.id) ?? {
    values: new Map<string, FormValue>(),
    submitted: false,
  }

  context.formDrafts?.set(component.id, draft)

  for (const element of definition.rows.flat(2)) {
    const field = formField(element, choices)

    if (!field) continue
    const key = JSON.stringify(field.path)

    if (draft.values.has(key)) continue
    const current = context.bindings?.read({ source: 'game.state', path: field.path })
    draft.values.set(key, current?.status === 'resolved' ? current.value : field.default)
  }

  const listeners = new Set<() => void>()

  const preview: IGameBindings = {
    read(binding) {
      const key = JSON.stringify(binding.path)
      let value = binding.source === 'game.state' ? draft.values.get(key) : undefined

      if (value === undefined && !context.bindings && binding.source === 'game.state') {
        const initial = defaults?.rules?.state.find(
          (entry) => JSON.stringify(entry.path) === key,
        )?.value

        value =
          typeof initial === 'object'
            ? (defaults?.ruleTranslation?.messages[initial.textKey] ??
              defaults?.ruleTranslation?.fallback[initial.textKey])
            : initial
      }

      if (value !== undefined) return { status: 'resolved', value }

      return (
        context.bindings?.read(binding) ?? {
          status: 'unresolved',
          diagnostic: { ...binding, reason: 'missing-path' },
        }
      )
    },
    subscribeChanges(listener) {
      listeners.add(listener)
      const release = context.bindings?.subscribeChanges(listener)

      return () => {
        listeners.delete(listener)
        release?.()
      }
    },
  }

  const graphics = new GraphicComponentRenderer()
  const images: RenderedComponent[] = []
  const submit = document.createElement('button')
  const unavailable = !scene || !submitForm || Boolean(context.suspendedBindings)
  const feedback = document.createElement('p')
  feedback.setAttribute('role', 'status')
  feedback.hidden = true
  let active = true

  for (const row of definition.rows) {
    const line = document.createElement('div')
    line.className = 'ancadeba-form-row'

    for (const column of row) {
      const group = document.createElement('div')
      group.className = 'ancadeba-form-column'

      for (const element of column) {
        const field = formField(element, choices)

        if (field) {
          const key = JSON.stringify(field.path)
          group.append(
            fieldControl(
              document,
              field,
              element.type === 'choice' ? element.choice : key,
              draft.values.get(key)!,
              (value) => {
                draft.values.set(key, value)
                draft.submitted = false
                submit.disabled = unavailable
                feedback.hidden = true

                for (const listener of listeners) listener()
              },
            ),
          )
        } else {
          const graphic =
            element.type === 'portrait'
              ? profile?.portrait
              : element.type === 'graphic'
                ? element
                : undefined

          if (!graphic) continue

          const image = graphics.render(
            {
              ...graphic,
              type: 'graphic',
              id: component.id + '-graphic-' + images.length,
              placement: component.placement,
              alt:
                element.type === 'graphic'
                  ? element.alt
                  : runtimeText(context.game, 'character.portrait'),
              fit: 'contain',
            },
            { ...context, bindings: preview },
          )

          images.push(image)
          group.append(image.element)
        }
      }

      line.append(group)
    }

    form.append(line)
  }

  const actions = document.createElement('div')
  actions.className = 'ancadeba-form-actions'

  if (component.backScene) {
    const cancel = document.createElement('button')
    cancel.type = 'button'
    cancel.textContent = component.cancelLabel
    cancel.addEventListener('click', () => {
      if (active) context.onButtonActivate?.({ type: 'enter-scene', scene: component.backScene! })
    })
    actions.append(cancel)
  }

  submit.type = 'submit'
  submit.textContent = component.submitLabel
  submit.disabled = unavailable || draft.submitted
  actions.append(submit)
  form.append(actions, feedback)
  form.addEventListener('submit', (event) => {
    event.preventDefault()

    if (!active || submit.disabled || !scene || !submitForm) return
    submit.disabled = true
    const reason = submitForm(scene, component.id, new Map(draft.values))
    draft.submitted = !reason

    if (reason) {
      submit.disabled = false
      feedback.textContent = reason
      feedback.hidden = false
    }
  })

  return {
    element: form,
    dispose() {
      active = false

      for (const image of images) image.dispose()
      form.remove()
    },
  }
}

export class FormRenderer {
  render(component: Placement, context: ComponentRenderContext): RenderedComponent {
    const definition = context.game?.forms?.get(component.form)

    if (!definition) throw new Error(`Missing form: ${component.form}`)

    return renderForm(
      component,
      definition,
      (context.localization?.current ?? context.game)?.characterProfile,
      context,
    )
  }
}
