import type { ProjectView } from '@ancadeba/editor-core'
import { assetIdSchema, graphicAppearanceSchema, type AppearanceLibrary } from '@ancadeba/schemas'
import { CharacterViewRenderer, type RenderedComponent } from '@ancadeba/ui-components'
import type { Translate } from '@ancadeba/utilities'
import type { ProjectPanelDependencies } from './projectPanelDependencies.js'
import { graphicAppearanceForm } from './graphicAppearanceForm.js'
import { personalAppearanceFields } from './personalAppearanceFields.js'
import { ruleFormControls } from './ruleFormControls.js'
import { startingGameBindings } from './textBindingChoices.js'

export function bindAppearanceLibrary(
  root: HTMLElement,
  t: Translate,
  edited: () => void,
  createGraphics?: ProjectPanelDependencies['createGraphics'],
) {
  const controls = ruleFormControls(root.ownerDocument, edited, t)
  const { select, input, button, group, create } = controls
  let library: AppearanceLibrary = { presets: {}, characters: {} }
  let view: ProjectView | undefined
  let path = ''
  let presetId = ''
  let characterId = ''
  let slotId = ''
  let resources: ReturnType<NonNullable<typeof createGraphics>> | undefined
  const rendered: RenderedComponent[] = []
  const renderer = new CharacterViewRenderer()
  const preview = create('div')
  preview.className = 'appearance-preview'
  const artEntry = { graphicColor: '', graphicSlot: '' }

  const disposeViews = () => {
    for (const item of rendered.splice(0)) item.dispose()
  }

  function previewCharacter() {
    disposeViews()
    preview.replaceChildren()

    if (!view?.assets || !createGraphics || root.hidden) return
    const character = library.characters[characterId]
    const samplePreset = character?.preset === presetId ? undefined : library.presets[presetId]
    const previewId = samplePreset ? 'preview' : characterId

    if (!samplePreset && (!character || !library.presets[character.preset])) return

    const appearances = samplePreset
      ? { presets: library.presets, characters: { preview: { preset: presetId } } }
      : library

    resources ??= createGraphics(path)

    const context = {
      document: root.ownerDocument,
      appearances,
      assets: view.assets,
      graphics: resources,
      bindings: startingGameBindings(view),
      inventoryDefinition: view.inventory,
      bindingMode: 'editor' as const,
    }

    for (const kind of ['full-body', 'portrait'] as const) {
      const title = kind === 'full-body' ? t('appearance.fullBody') : t('form.portrait')
      const frame = group(title)

      try {
        const image = renderer.render(
          {
            type: 'character-view',
            id: previewId,
            character: previewId,
            view: kind,
            label: samplePreset ? presetId : characterId,
            placement: { row: 1, column: 1, rowSpan: 1, columnSpan: 1 },
          },
          context,
        )

        rendered.push(image)
        frame.append(image.element)
      } catch (error) {
        frame.append(error instanceof Error ? error.message : String(error))
      }

      preview.append(frame)
    }
  }

  const change = (op: () => void) => {
    op()
    edited()
    draw()
  }

  const refreshPreview = () => {
    edited()
    previewCharacter()
  }

  function createEntry(
    label: string,
    actionLabel: string,
    ids: readonly string[],
    add: (id: string) => void,
  ) {
    const field = input(label, '', () => {})
    const control = field.querySelector('input')!

    const action = button(actionLabel, () => {
      const id = control.value.trim()

      if (!assetIdSchema.safeParse(id).success || ids.includes(id)) {
        control.setCustomValidity(t('appearance.invalidId'))
        control.reportValidity()

        return
      }

      change(() => add(id))
    })

    control.addEventListener('input', () => {
      if (control.validity?.customError) control.setCustomValidity('')
    })

    return controls.row(field, action)
  }

  function draw() {
    root.replaceChildren()

    if (!view || root.hidden) {
      disposeViews()

      return
    }

    const catalog = view.assets

    const visuals = [catalog?.images, catalog?.parts, catalog?.compositions].flatMap((values) =>
      Object.keys(values ?? {}),
    )

    if (!catalog || !visuals.length) {
      root.append(t('graphic.artFirst'))

      return
    }

    const presets = Object.keys(library.presets)
    const characters = Object.keys(library.characters)

    if (!presets.includes(presetId)) presetId = presets[0] ?? ''

    if (!characters.includes(characterId)) characterId = characters[0] ?? ''

    const art = group(
      t('appearance.presets'),
      createEntry(t('appearance.presetId'), t('appearance.addPreset'), presets, (id) => {
        library.presets[id] = {
          visual: visuals[0]!,
          appearance: graphicAppearanceSchema.parse({}),
          equipment: {},
        }
        presetId = id
      }),
    )

    root.append(art)
    const preset = library.presets[presetId]

    if (!preset) return
    art.append(
      select(
        t('appearance.preset'),
        presetId,
        presets,
        (id) => {
          presetId = id
          characterId = characters.find((key) => library.characters[key]!.preset === id) ?? ''
          draw()
        },
        false,
      ),
      select(t('graphic.visual'), preset.visual, visuals, (id) =>
        change(() => {
          preset.visual = id
          preset.appearance = graphicAppearanceSchema.parse({})
          preset.equipment = {}
          delete preset.portraitCrop
        }),
      ),
    )

    const bounds = (
      catalog.images[preset.visual] ??
      catalog.parts[preset.visual] ??
      catalog.compositions[preset.visual]
    )?.bounds

    if (bounds) {
      const crop = group(t('appearance.frame'))
      crop.append(
        select(
          t('appearance.frame'),
          preset.portraitCrop ? 'crop' : 'full',
          [
            ['full', t('appearance.fullBody')],
            ['crop', t('appearance.crop')],
          ],
          (value) =>
            change(() => {
              if (value === 'crop') preset.portraitCrop = { ...bounds }
              else delete preset.portraitCrop
            }),
        ),
      )

      if (preset.portraitCrop)
        for (const key of ['x', 'y', 'width', 'height'] as const)
          crop.append(
            input(
              t(`appearance.${key}`),
              String(preset.portraitCrop[key]),
              (value) => {
                preset.portraitCrop![key] = Number(value)
                refreshPreview()
              },
              'number',
            ),
          )
      art.append(crop)
    }

    const composition = catalog.compositions[preset.visual]
    const targets = Object.keys(composition?.slots ?? {})

    const slots = [
      ...new Set([
        ...Object.keys(preset.equipment),
        ...Object.values(view.inventory?.owners ?? {}).flatMap((owner) =>
          Object.keys(owner.equipmentSlots),
        ),
      ]),
    ]

    if (targets.length && slots.length) {
      const equipment = group(t('appearance.equipment'))

      for (const slot of slots)
        equipment.append(
          select(slot, preset.equipment[slot] ?? '', [['', t('form.none')], ...targets], (value) =>
            change(() => {
              if (value) preset.equipment[slot] = value
              else delete preset.equipment[slot]
            }),
          ),
        )
      art.append(equipment)
    }

    art.append(
      graphicAppearanceForm(
        controls,
        view,
        catalog,
        preset.visual,
        preset.appearance,
        true,
        change,
        refreshPreview,
        artEntry,
        draw,
      ),
    )

    const people = group(
      t('appearance.characters'),
      createEntry(t('appearance.characterId'), t('appearance.addCharacter'), characters, (id) => {
        library.characters[id] = { preset: presetId }
        characterId = id
      }),
    )

    root.append(people)
    const character = library.characters[characterId]

    if (!character) {
      root.append(preview)
      previewCharacter()

      return
    }

    people.append(
      select(
        t('appearance.character'),
        characterId,
        characters,
        (id) => {
          characterId = id
          presetId = library.characters[id]!.preset
          draw()
        },
        false,
      ),
      select(t('appearance.characterPreset'), character.preset, presets, (id) =>
        change(() => {
          character.preset = id
          presetId = id
          delete character.overrides
        }),
      ),
      select(
        t('appearance.owner'),
        character.owner ?? '',
        [['', t('form.none')], ...Object.keys(view.inventory?.owners ?? {})],
        (id) =>
          change(() => {
            character.owner = id || undefined
          }),
      ),
    )
    const characterPreset = library.presets[character.preset]

    if (characterPreset)
      people.append(
        personalAppearanceFields(
          controls,
          view,
          catalog,
          characterPreset,
          character,
          slotId,
          (id) => {
            slotId = id
            draw()
          },
          change,
          refreshPreview,
        ),
      )
    root.append(preview)
    previewCharacter()
  }

  return {
    draw,
    read: () => library,
    restore(value: AppearanceLibrary) {
      library = structuredClone(value)
      draw()
    },
    render(next: ProjectView, projectPath: string, replace: boolean) {
      if (path !== projectPath) {
        disposeViews()
        resources?.dispose()
        resources = undefined
        path = projectPath
        presetId = ''
        characterId = ''
        slotId = ''
      }

      view = next

      if (replace)
        library = structuredClone(next.game?.appearances ?? { presets: {}, characters: {} })
      draw()
    },
    dispose() {
      disposeViews()
      resources?.dispose()
    },
  }
}
