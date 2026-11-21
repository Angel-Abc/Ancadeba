import { CharacterViewRenderer } from './characterViewRenderer.js'
import { runtimeText, type IGameBindings, type SceneComponentData } from '@ancadeba/game-runtime'
import type {
  ChoiceDefinition,
  CharacterProfileDefinition,
  RuntimeTextKey,
} from '@ancadeba/schemas'
import type {
  ComponentRenderContext,
  IComponentRenderer,
  RenderedComponent,
} from './componentRendering.js'
import { GraphicComponentRenderer } from './graphicComponentRenderer.js'
import { StatusPanelComponentRenderer } from './statusPanelComponentRenderer.js'

type Sheet = Extract<SceneComponentData, { type: 'character-sheet' }>

const profileFor = (context: ComponentRenderContext) =>
  (context.localization?.current ?? context.game)?.characterProfile

const text = (context: ComponentRenderContext, key: RuntimeTextKey) =>
  runtimeText(context.game, key)

function selectedOption(field: ChoiceDefinition, bindings: IGameBindings | undefined) {
  const result = bindings?.read({ source: 'game.state', path: field.path })

  if (result?.status === 'resolved') return field.options.find(({ id }) => id === result.value)
}

function characterRoot(component: Sheet, context: ComponentRenderContext) {
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
  component: Sheet,
  profile: CharacterProfileDefinition,
  context: ComponentRenderContext,
  bindings: IGameBindings | undefined,
) {
  const rendered = new CharacterViewRenderer(graphics).render(
    {
      ...component,
      type: 'character-view',
      view: 'portrait',
      character: profile.character,
      label: text(context, 'character.portrait'),
    },
    { ...context, bindings },
  )

  rendered.element.classList.add('ancadeba-character-portrait')

  return rendered
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

      const choices = (context.localization?.current ?? context.game)?.choices

      for (const id of profile.fields) {
        const field = choices?.get(id)

        if (!field) continue
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
