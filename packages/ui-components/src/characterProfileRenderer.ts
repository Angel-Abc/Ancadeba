import { runtimeText, type IGameBindings, type SceneComponentData } from '@ancadeba/game-runtime'
import type { CharacterProfileDefinition, RuntimeTextKey } from '@ancadeba/schemas'
import type {
  ComponentRenderContext,
  IComponentRenderer,
  RenderedComponent,
} from './componentRendering.js'
import { GraphicComponentRenderer } from './graphicComponentRenderer.js'
import { StatusPanelComponentRenderer } from './statusPanelComponentRenderer.js'

type Creator = Extract<SceneComponentData, { type: 'character-creator' }>

type Sheet = Extract<SceneComponentData, { type: 'character-sheet' }>

type Field = CharacterProfileDefinition['fields'][number]

const profileFor = (context: ComponentRenderContext) =>
  (context.localization?.current ?? context.game)?.characterProfile

const text = (context: ComponentRenderContext, key: RuntimeTextKey) =>
  runtimeText(context.game, key)

function selectedOption(field: Field, bindings: IGameBindings | undefined) {
  const result = bindings?.read({ source: 'game.state', path: field.path })

  if (result?.status === 'resolved') return field.options.find(({ id }) => id === result.value)
}

function characterRoot(component: Creator | Sheet, context: ComponentRenderContext) {
  const root = context.document.createElement('section')
  root.className = 'ancadeba-character'
  root.setAttribute('aria-label', component.label)
  const heading = context.document.createElement('h2')
  heading.textContent = component.label
  root.append(heading)

  return root
}

function portrait(
  graphics: GraphicComponentRenderer,
  component: Creator | Sheet,
  profile: CharacterProfileDefinition,
  context: ComponentRenderContext,
  bindings: IGameBindings | undefined,
) {
  const rendered = graphics.render(
    {
      id: `${component.id}-portrait`,
      type: 'graphic',
      placement: component.placement,
      ...profile.portrait,
      alt: text(context, 'character.portrait'),
      fit: 'contain',
    },
    { ...context, bindings },
  )

  rendered.element.classList.add('ancadeba-character-portrait')

  return rendered
}

export class CharacterCreatorRenderer implements IComponentRenderer<Creator> {
  constructor(private readonly graphics = new GraphicComponentRenderer()) {}

  render(component: Creator, context: ComponentRenderContext): RenderedComponent {
    const { document, scene, confirmCharacter, characterDrafts } = context
    const root = characterRoot(component, context)
    const profile = profileFor(context)

    if (!profile) return { element: root, dispose: () => root.remove() }

    const draft =
      characterDrafts?.get(component.id) ??
      new Map(
        profile.fields.map((field) => [
          field.id,
          selectedOption(field, context.bindings)?.id ?? field.default,
        ]),
      )

    characterDrafts?.set(component.id, draft)

    const fieldsByPath = new Map(
      profile.fields.map((field) => [JSON.stringify(field.path), field.id]),
    )

    const listeners = new Set<() => void>()

    const preview: IGameBindings = {
      read(binding) {
        const id = binding.source === 'game.state' && fieldsByPath.get(JSON.stringify(binding.path))
        const result = id ? draft.get(id) : undefined

        if (result !== undefined) return { status: 'resolved', value: result }

        return (
          context.bindings?.read(binding) ?? {
            status: 'unresolved',
            diagnostic: { source: binding.source, path: binding.path, reason: 'missing-path' },
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

    const image = portrait(this.graphics, component, profile, context, preview)
    const form = document.createElement('form')
    const controls = document.createElement('div')
    controls.className = 'ancadeba-character-controls'

    for (const field of profile.fields) {
      const label = document.createElement('label')
      label.textContent = field.label
      const input = document.createElement('select')
      input.name = field.id

      for (const choice of field.options) {
        const option = document.createElement('option')
        option.value = choice.id
        option.textContent = choice.label
        input.append(option)
      }

      input.value = draft.get(field.id) ?? field.default
      input.addEventListener('change', () => {
        draft.set(field.id, input.value)

        for (const listener of listeners) listener()
      })
      label.append(input)
      controls.append(label)
    }

    const actions = document.createElement('div')
    actions.className = 'ancadeba-character-actions'

    if (component.backScene) {
      const back = document.createElement('button')
      back.type = 'button'
      back.textContent = text(context, 'character.back')
      back.addEventListener('click', () => {
        context.onButtonActivate?.({ type: 'enter-scene', scene: component.backScene! })
      })
      actions.append(back)
    }

    const proceed = document.createElement('button')
    proceed.type = 'submit'
    proceed.textContent = text(context, 'character.continue')
    proceed.disabled = !confirmCharacter || !scene || Boolean(context.suspendedBindings)
    actions.append(proceed)
    const feedback = document.createElement('p')
    feedback.setAttribute('role', 'status')
    feedback.hidden = true
    let active = true
    form.addEventListener('submit', (event) => {
      event.preventDefault()

      if (!active || proceed.disabled || !scene || !confirmCharacter) return
      proceed.disabled = true

      if (!confirmCharacter(scene, component.id, draft)) {
        proceed.disabled = false
        feedback.hidden = false
        feedback.textContent = text(context, 'character.unavailable')
      }
    })
    controls.append(actions, feedback)
    form.append(image.element, controls)
    root.append(form)

    return {
      element: root,
      dispose() {
        active = false
        image.dispose()
        root.remove()
      },
    }
  }
}

export class CharacterSheetRenderer implements IComponentRenderer<Sheet> {
  constructor(
    private readonly graphics = new GraphicComponentRenderer(),
    private readonly status = new StatusPanelComponentRenderer(),
  ) {}

  render(component: Sheet, context: ComponentRenderContext): RenderedComponent {
    const root = characterRoot(component, context)
    const profile = profileFor(context)
    const bindings = context.bindings ?? context.suspendedBindings

    if (!profile || !bindings) return { element: root, dispose: () => root.remove() }

    const image = portrait(this.graphics, component, profile, context, bindings)
    const details = context.document.createElement('dl')

    const stats = this.status.render(
      {
        id: `${component.id}-stats`,
        type: 'status-panel',
        placement: component.placement,
        label: text(context, 'character.stats'),
        name: '',
        rows: component.rows,
        effects: [],
      },
      { ...context, bindings },
      true,
    )

    const update = () => {
      details.replaceChildren()

      for (const field of profile.fields) {
        const selected = selectedOption(field, bindings)

        if (!selected) continue
        const name = context.document.createElement('dt')
        name.textContent = field.label
        const value = context.document.createElement('dd')
        value.textContent = selected.label
        details.append(name, value)
      }
    }

    update()
    const unsubscribe = bindings.subscribeChanges(update)
    const body = context.document.createElement('div')
    body.className = 'ancadeba-character-body'
    const summary = context.document.createElement('div')
    summary.append(details, stats.element)
    body.append(image.element, summary)
    root.append(body)

    return {
      element: root,
      dispose() {
        unsubscribe()
        stats.dispose()
        image.dispose()
        root.remove()
      },
    }
  }
}
