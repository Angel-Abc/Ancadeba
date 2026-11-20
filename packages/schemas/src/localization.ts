import { sceneSchema, shopMessageSchema, type SceneDefinition } from './scene.js'
import type { GameDefinition } from './game.js'
import type { LanguageCatalog } from './languages.js'

export interface GameTranslation {
  readonly fallback: LanguageCatalog
  readonly messages: LanguageCatalog
}

/** Resolve catalog strings before game bindings, so translated templates use the same aliases. */
export function localizeDefinitions(
  game: GameDefinition,
  scenes: ReadonlyMap<string, SceneDefinition>,
  translation: GameTranslation,
) {
  const text = (key: string | undefined, literal: string, required = false): string => {
    if (key === undefined) return literal

    if (!Object.hasOwn(translation.fallback, key))
      throw new Error(`Missing default translation: ${key}`)

    const value = Object.hasOwn(translation.messages, key)
      ? translation.messages[key]!
      : translation.fallback[key]!

    if (required && !value.trim()) throw new Error(`Translation must not be empty: ${key}`)

    return value
  }

  const metadata = (definition: GameDefinition | SceneDefinition) => ({
    title: text(definition.titleKey, definition.title, true),
    description: text(definition.descriptionKey, definition.description),
  })

  const profile = game.characterProfile

  const localizedGame = {
    ...game,
    ...metadata(game),
    ...(profile && {
      characterProfile: {
        ...profile,
        fields: profile.fields.map((field) => ({
          ...field,
          label: text(field.labelKey, field.label, true),
          options: field.options.map((option) => ({
            ...option,
            label: text(option.labelKey, option.label, true),
          })),
        })),
      },
    }),
  }

  if (!localizedGame.title.trim()) throw new Error('Translated game title must not be empty')

  return {
    game: localizedGame,
    scenes: new Map<string, SceneDefinition>(
      [...scenes].map(([id, scene]) => [
        id,
        sceneSchema.parse({
          ...scene,
          ...metadata(scene),
          components: scene.components.map((component) =>
            component.type === 'combat' ||
            component.type === 'character-progression' ||
            component.type === 'background-image'
              ? component
              : component.type === 'shop'
                ? {
                    ...component,
                    label: text(component.labelKey, component.label, true),
                    currency: text(component.currencyKey, component.currency, true),
                    messages: Object.fromEntries(
                      shopMessageSchema.options.map((id) => [
                        id,
                        text(component.messageKeys[id], component.messages[id]),
                      ]),
                    ),
                  }
                : component.type === 'item-details' || component.type === 'action-info'
                  ? {
                      ...component,
                      label: text(component.labelKey, component.label, true),
                      emptyText: text(component.emptyTextKey, component.emptyText),
                    }
                  : component.type === 'character-sheet'
                    ? {
                        ...component,
                        label: text(component.labelKey, component.label, true),
                        rows: component.rows.map((row) => ({
                          ...row,
                          label: text(row.labelKey, row.label, true),
                        })),
                      }
                    : component.type === 'status-panel'
                      ? {
                          ...component,
                          label: text(component.labelKey, component.label, true),
                          name: text(component.nameKey, component.name),
                          rows: component.rows.map((row) => ({
                            ...row,
                            label: text(row.labelKey, row.label, true),
                          })),
                          effects: component.effects.map((effect) => ({
                            ...effect,
                            label: text(effect.labelKey, effect.label, true),
                            description: text(effect.descriptionKey, effect.description),
                          })),
                        }
                      : component.type === 'nearby'
                        ? {
                            ...component,
                            label: text(component.labelKey, component.label, true),
                            entries: Object.fromEntries(
                              Object.entries(component.entries).map(([id, entry]) => [
                                id,
                                {
                                  ...entry,
                                  label: text(entry.labelKey, entry.label, true),
                                  description: text(entry.descriptionKey, entry.description),
                                },
                              ]),
                            ),
                          }
                        : component.type === 'action-bar'
                          ? {
                              ...component,
                              slots: Object.fromEntries(
                                Object.entries(component.slots).map(([id, slot]) => [
                                  id,
                                  {
                                    ...slot,
                                    label: text(slot.labelKey, slot.label, true),
                                    description: text(slot.descriptionKey, slot.description ?? ''),
                                    unavailableText: text(
                                      slot.unavailableTextKey,
                                      slot.unavailableText ?? '',
                                    ),
                                  },
                                ]),
                              ),
                            }
                          : component.type === 'button'
                            ? {
                                ...component,
                                label: text(component.labelKey, component.label, true),
                                description: text(
                                  component.descriptionKey,
                                  component.description ?? '',
                                ),
                                unavailableText: text(
                                  component.unavailableTextKey,
                                  component.unavailableText ?? '',
                                ),
                              }
                            : component.type === 'graphic'
                              ? { ...component, alt: text(component.altKey, component.alt) }
                              : component.type === 'text'
                                ? { ...component, text: text(component.textKey, component.text) }
                                : {
                                    ...component,
                                    label: text(component.labelKey, component.label, true),
                                    ...(component.type === 'form' && {
                                      submitLabel: text(
                                        component.submitLabelKey,
                                        component.submitLabel,
                                        true,
                                      ),
                                      cancelLabel: text(
                                        component.cancelLabelKey,
                                        component.cancelLabel,
                                        true,
                                      ),
                                    }),
                                  },
          ),
        }),
      ]),
    ),
  }
}

/** Keys cannot silently render as empty text when the manifest has no language catalogs. */
export function assertGameLanguages(
  game: GameDefinition,
  scenes: ReadonlyMap<string, SceneDefinition>,
): void {
  if (game.languages) return

  if (
    [...scenes.values()].some((scene) =>
      scene.components.some((component) => component.type === 'language-select'),
    )
  )
    throw new Error('Language selectors require languages in game.json')

  const keyed =
    game.titleKey !== undefined ||
    game.descriptionKey !== undefined ||
    game.characterProfile?.fields.some(
      (field) => field.labelKey || field.options.some((option) => option.labelKey),
    ) ||
    [...scenes.values()].some(
      (scene) =>
        scene.titleKey !== undefined ||
        scene.descriptionKey !== undefined ||
        scene.components.some((component) =>
          component.type === 'combat' ||
          component.type === 'character-progression' ||
          component.type === 'background-image'
            ? false
            : component.type === 'shop'
              ? component.labelKey !== undefined ||
                component.currencyKey !== undefined ||
                Object.keys(component.messageKeys).length > 0
              : component.type === 'item-details' || component.type === 'action-info'
                ? component.labelKey !== undefined || component.emptyTextKey !== undefined
                : component.type === 'character-sheet'
                  ? component.labelKey !== undefined ||
                    component.rows.some((row) => row.labelKey !== undefined)
                  : component.type === 'status-panel'
                    ? component.labelKey !== undefined ||
                      component.nameKey !== undefined ||
                      component.rows.some((row) => row.labelKey !== undefined) ||
                      component.effects.some(
                        (effect) =>
                          effect.labelKey !== undefined || effect.descriptionKey !== undefined,
                      )
                    : component.type === 'nearby'
                      ? component.labelKey !== undefined ||
                        Object.values(component.entries).some(
                          (entry) =>
                            entry.labelKey !== undefined || entry.descriptionKey !== undefined,
                        )
                      : component.type === 'action-bar'
                        ? Object.values(component.slots).some(
                            (slot) =>
                              slot.labelKey !== undefined ||
                              slot.descriptionKey !== undefined ||
                              slot.unavailableTextKey !== undefined,
                          )
                        : component.type === 'button'
                          ? component.labelKey !== undefined ||
                            component.descriptionKey !== undefined ||
                            component.unavailableTextKey !== undefined
                          : component.type === 'graphic'
                            ? component.altKey !== undefined
                            : component.type === 'text'
                              ? component.textKey !== undefined
                              : component.labelKey !== undefined ||
                                (component.type === 'form' &&
                                  (component.submitLabelKey !== undefined ||
                                    component.cancelLabelKey !== undefined)),
        ),
    )

  if (keyed) throw new Error('Translation keys require languages in game.json')
}
