import type { ProjectView } from '@ancadeba/editor-core'
import type { ButtonComponentDefinition } from '@ancadeba/schemas'
import type { BasicComponent } from './componentDrafts.js'
import { textBindingsForm, type TextBindingPending } from './textBindingsForm.js'
import { translationChoices, type RuleFormControls } from './ruleFormControls.js'
import { sceneEntranceFields } from './sceneEntranceFields.js'
import { mapInteractFields } from './mapInteractFields.js'
import { actionDescriptionFields } from './actionDescriptionFields.js'
import { sceneChoices } from './choiceLabels.js'

type ButtonAction = NonNullable<ButtonComponentDefinition['action']>

export function basicComponentFields(
  controls: RuleFormControls,
  view: ProjectView,
  sceneId: string,
  draft: Exclude<BasicComponent, { type: 'character-sheet' }>,
  render: () => void,
  bindingPending: TextBindingPending,
  selection: { binding: string },
  sections: { main: HTMLElement[]; behavior: HTMLElement[]; layout: HTMLElement[] },
  openAsset: (id: string) => HTMLElement,
  openMap: (id: string) => HTMLElement,
) {
  const { main, behavior, layout } = sections
  const { input, select, translation, create, t } = controls

  if (draft.type === 'background-image') {
    const images = Object.keys(view.assets?.images ?? {})

    if (images.length === 0) {
      const help = create('p')
      help.className = 'help'
      help.textContent = t('graphic.artFirst')

      main.push(help)

      return
    }

    main.push(
      select(t('assets.image'), draft.image, images, (value) => {
        draft.image = value
      }),
      openAsset(draft.image),
    )

    return layout.push(
      select(
        t('assets.fit'),
        draft.fit,
        [
          ['cover', t('assets.cover')],
          ['contain', t('assets.contain')],
        ],
        (value) => {
          draft.fit = value
        },
      ),
    )
  }

  const literal = (title: string, emptyLabel: string) =>
    translation(
      title,
      draft.type === 'text' ? (draft.textKey ?? '') : (draft.labelKey ?? ''),
      translationChoices(view, emptyLabel),
      (value) => {
        if (draft.type === 'text') draft.textKey = value || undefined
        else draft.labelKey = value || undefined
      },
    )

  if (draft.type === 'text') {
    const text = create('textarea')
    text.rows = 4
    text.value = draft.text

    const bindings = textBindingsForm(
      controls,
      view,
      draft,
      bindingPending,
      view.scenes.find((scene) => scene.id === sceneId)?.type === 'game',
      render,
      (placeholder) => {
        draft.text += `${draft.text && !/\s$/.test(draft.text) ? ' ' : ''}${placeholder}`
        text.value = draft.text
      },
      selection,
    )

    text.addEventListener('input', () => {
      draft.text = text.value
      controls.markEdited()
      bindings.refresh()
    })
    const textField = create('label')
    textField.append(t('tree.text'), text)

    main.push(
      textField,
      translation(
        t('component.textTranslation'),
        draft.textKey ?? '',
        translationChoices(view, t('metadata.literalText')),
        (value) => {
          draft.textKey = value || undefined
          bindings.refresh()
        },
      ),
    )
    behavior.push(bindings.element)

    return layout.push(
      select(
        t('component.style'),
        draft.presentation.variant,
        [
          ['body', t('component.bodyText')],
          ['heading', t('component.headingStyle')],
        ],
        (value) => {
          draft.presentation.variant = value
        },
      ),
      select(
        t('component.alignment'),
        draft.presentation.align,
        [
          ['start', t('component.alignStart')],
          ['center', t('component.alignCenter')],
          ['end', t('component.alignEnd')],
        ],
        (value) => {
          draft.presentation.align = value
        },
      ),
    )
  }

  const label = [
    input(t('form.label'), draft.label, (value) => {
      draft.label = value
    }),
    literal(t('form.labelTranslation'), t('form.literalLabel')),
  ]

  main.push(...label)

  if (draft.type === 'action-info') {
    const help = create('p')
    help.className = 'help'
    help.textContent = t('actionInfo.help')

    return main.push(
      input(t('items.emptyText'), draft.emptyText, (value) => {
        draft.emptyText = value
      }),
      translation(
        t('items.emptyTextTranslation'),
        draft.emptyTextKey ?? '',
        translationChoices(view, t('form.literalText')),
        (value) => {
          draft.emptyTextKey = value || undefined
        },
      ),
      help,
    )
  }

  if (draft.type === 'quest-log')
    return behavior.push(
      input(t('component.questIds'), draft.quests?.join(', ') ?? '', (value) => {
        draft.quests = value.trim() ? value.split(',').map((id) => id.trim()) : undefined
      }),
      select(
        t('component.mainTextTarget'),
        draft.textTarget ?? '',
        [
          '',
          ...(view.scenes
            .find((scene) => scene.id === sceneId)
            ?.components.filter((component) => component.type === 'text')
            .map((component) => component.id) ?? []),
        ],
        (value) => {
          draft.textTarget = value || undefined
        },
      ),
      ...(['not-started', 'active', 'ready', 'completed'] as const).map((status) =>
        select(
          t('component.showStatus', { status }),
          String(draft.statuses.includes(status)),
          ['true', 'false'],
          (value) => {
            draft.statuses =
              value === 'true'
                ? [...new Set([...draft.statuses, status])]
                : draft.statuses.filter((entry) => entry !== status)
          },
        ),
      ),
    )

  if (draft.type === 'character-creator') {
    const destinations = { ...view, scenes: view.scenes.filter((entry) => entry.id !== sceneId) }
    const origin = view.scenes.find((entry) => entry.id === sceneId)

    return behavior.push(
      select(
        t('character.continueScene'),
        draft.continueScene,
        sceneChoices(destinations, 'game'),
        (value) => {
          draft.continueScene = value
        },
      ),
      select(
        t('character.backScene'),
        draft.backScene ?? '',
        [['', t('form.none')], ...sceneChoices(destinations, origin?.type)],
        (value) => {
          draft.backScene = value || undefined
        },
      ),
    )
  }

  if (draft.type === 'language-select' || draft.type === 'save-status') return

  if (draft.type === 'save-slots')
    return behavior.push(
      select(t('saving.showName'), String(draft.showName), ['true', 'false'], (value) => {
        draft.showName = value === 'true'
      }),
    )

  if (draft.type === 'save-point') {
    const mapViews =
      view.scenes
        .find((scene) => scene.id === sceneId)
        ?.components.filter(
          (component) =>
            component.type === 'map-view' &&
            component.playerSpawn &&
            component.interactive !== false,
        ) ?? []

    return behavior.push(
      select(
        t('saving.saveMenu'),
        draft.menuScene ?? '',
        [
          ['', t('saving.directSave')],
          ...view.scenes
            .filter((scene) => scene.type === 'stand-alone')
            .map((scene) => [scene.id, scene.title || scene.id] as const),
        ],
        (value) => {
          draft.menuScene = value || undefined
        },
      ),
      select(
        t('saving.pointLocation'),
        draft.location?.mapView ?? '',
        [
          ['', t('saving.wholeScene')],
          ...mapViews.map((component) => [component.id, component.id] as const),
        ],
        (value) => {
          draft.location = value
            ? { mapView: value, position: { x: 0, y: 0 }, radius: 0 }
            : undefined
          render()
        },
      ),
      ...(draft.location
        ? [
            ...(['x', 'y'] as const).map((axis) =>
              input(
                axis === 'x' ? t('component.playerColumn') : t('component.playerRow'),
                String(draft.location!.position[axis]),
                (value) => {
                  draft.location!.position[axis] = Number(value)
                },
                'number',
              ),
            ),
            input(
              t('saving.radius'),
              String(draft.location.radius),
              (value) => {
                draft.location!.radius = Number(value)
              },
              'number',
            ),
          ]
        : []),
    )
  }

  if (draft.type === 'map-view') {
    const viewport = draft.viewport

    main.push(
      select(t('maps.map'), draft.map, view.game?.maps ?? [], (value) => {
        draft.map = value
        const map = view.maps?.[value]

        if (map) {
          viewport.columns = Math.min(viewport.columns, map.width)
          viewport.rows = Math.min(viewport.rows, map.height)
        }

        render()
      }),
      openMap(draft.map),
    )

    return behavior.push(
      select(
        t('component.interactive'),
        String(draft.interactive !== false),
        [
          ['true', t('component.interactiveYes')],
          ['false', t('component.interactiveNo')],
        ],
        (value) => {
          draft.interactive = value === 'true' ? undefined : false
        },
      ),
      controls.group(
        t('component.visibleArea'),
        ...(
          [
            ['columns', t('grid.columns')],
            ['rows', t('grid.rows')],
            ['x', t('component.leftColumn')],
            ['y', t('component.topRow')],
          ] as const
        ).map(([key, title]) =>
          input(
            title,
            String(viewport[key]),
            (value) => {
              viewport[key] = Number(value)
            },
            'number',
          ),
        ),
      ),
      controls.group(
        t('component.playerMarker'),
        select(
          t('component.showPlayer'),
          String(Boolean(draft.playerSpawn)),
          [
            ['false', t('component.panMap')],
            ['true', t('component.movePlayer')],
          ],
          (value) => {
            draft.playerSpawn = value === 'true' ? { x: 0, y: 0 } : undefined
            render()
          },
        ),
        ...(draft.playerSpawn
          ? (['x', 'y'] as const).map((key) =>
              input(
                key === 'x' ? t('component.playerColumn') : t('component.playerRow'),
                String(draft.playerSpawn![key]),
                (value) => {
                  draft.playerSpawn![key] = Number(value)
                },
                'number',
              ),
            )
          : []),
      ),
    )
  }

  const scenes = view.scenes.map((scene) => scene.id)
  const gameScenes = view.scenes.filter((scene) => scene.type === 'game').map((scene) => scene.id)
  const actions = Object.keys(view.rules?.actions ?? {})

  const mapViews =
    view.scenes
      .find((scene) => scene.id === sceneId)
      ?.components.filter(
        (component) =>
          component.type === 'map-view' && component.playerSpawn && component.interactive !== false,
      )
      .map((component) => component.id) ?? []

  const action = draft.action

  const defaults = (type: string): ButtonAction | undefined =>
    type === 'save-game' ||
    type === 'load-game' ||
    type === 'resume-game' ||
    type === 'load-autosave' ||
    type === 'delete-save' ||
    type === 'export-save' ||
    type === 'import-save'
      ? { type }
      : type === 'open-menu' || type === 'main-menu'
        ? { type, scene: view.scenes.find((scene) => scene.type === 'stand-alone')?.id ?? '' }
        : type === 'new-game' || type === 'enter-scene'
          ? { type, scene: (type === 'new-game' ? gameScenes : scenes)[0] ?? '' }
          : type === 'request-action'
            ? { type, action: actions[0] ?? '' }
            : type === 'interact-map'
              ? { type, mapView: mapViews[0] ?? '' }
              : type === 'move-map'
                ? { type, mapView: mapViews[0] ?? '', direction: 'north' }
                : undefined

  main.push(...actionDescriptionFields(controls, view, draft))
  behavior.push(
    select(
      t('form.action'),
      action?.type ?? '',
      [
        ['', t('component.noAction')],
        ['new-game', t('component.startNewGame')],
        ['enter-scene', t('component.goToScene')],
        ['request-action', t('component.runAction')],
        ['move-map', t('component.moveOnMap')],
        ['interact-map', t('maps.interact')],
        ['save-game', t('component.saveProgress')],
        ['load-game', t('component.loadProgress')],
        ...(
          [
            'load-autosave',
            'delete-save',
            'export-save',
            'import-save',
            'open-menu',
            'resume-game',
            'main-menu',
          ] as const
        ).map((type) => [type, t(`saving.${type}`)] as const),
      ],
      (value) => {
        draft.action = defaults(value)
        render()
      },
    ),
    ...(action?.type === 'new-game' ||
    action?.type === 'enter-scene' ||
    action?.type === 'open-menu' ||
    action?.type === 'main-menu'
      ? [
          select(
            t('form.targetScene'),
            action.scene,
            sceneChoices(
              view,
              action.type === 'new-game'
                ? 'game'
                : action.type === 'open-menu' || action.type === 'main-menu'
                  ? 'stand-alone'
                  : undefined,
            ),
            (value) => {
              action.scene = value

              if (action.type === 'enter-scene') {
                delete action.mapView
                delete action.position
                render()
              }
            },
          ),
          ...(action.type === 'enter-scene'
            ? sceneEntranceFields(controls, view, action, render)
            : []),
        ]
      : action?.type === 'request-action'
        ? [
            select(t('component.ruleAction'), action.action, actions, (value) => {
              action.action = value
            }),
          ]
        : action?.type === 'interact-map'
          ? mapInteractFields(controls, view, sceneId, action, render)
          : action?.type === 'move-map'
            ? [
                select(t('tree.map-view'), action.mapView, mapViews, (value) => {
                  action.mapView = value
                }),
                select(
                  t('form.direction'),
                  action.direction,
                  [
                    ['north', t('component.north')],
                    ['east', t('component.east')],
                    ['south', t('component.south')],
                    ['west', t('component.west')],
                  ],
                  (value) => {
                    action.direction = value
                  },
                ),
              ]
            : []),
  )
}
