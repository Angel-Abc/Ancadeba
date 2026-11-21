import {
  characterAppearance,
  inventoryColors,
  type AppearanceLibrary,
  type AssetCatalog,
  type CharacterViewKind,
  type InventoryDefinition,
  type InventoryItem,
} from '@ancadeba/schemas'

/** Derives a character's artwork from the current state of their own equipment. */
export function resolveCharacterAppearance(
  library: AppearanceLibrary,
  id: string,
  view: CharacterViewKind,
  assets: AssetCatalog,
  inventory?: InventoryDefinition,
  items: readonly InventoryItem[] = [],
) {
  const character = Object.hasOwn(library.characters, id) && library.characters[id]

  const preset =
    character &&
    Object.hasOwn(library.presets, character.preset) &&
    library.presets[character.preset]

  if (!character || !preset) throw new Error('Unknown character or appearance preset: ' + id)
  const base = characterAppearance(preset.appearance, character.overrides)
  const slots = { ...base.slots }

  if (character.owner) {
    const equipped = new Map(
      items.flatMap((item) =>
        item.placement.type === 'equipped' && item.placement.owner === character.owner
          ? [[item.placement.slot, item] as const]
          : [],
      ),
    )

    for (const [slot, target] of Object.entries(preset.equipment)) {
      const item = equipped.get(slot)
      const part = item && inventory?.itemTypes[item.itemType]?.wornPart
      slots[target] = {
        part: part ?? null,
        visible: true,
        colors: part && item ? inventoryColors(item.colors, assets.parts[part]!) : {},
      }
    }
  }

  const bounds = (
    assets.images[preset.visual] ??
    assets.parts[preset.visual] ??
    assets.compositions[preset.visual]
  )?.bounds

  return {
    visual: preset.visual,
    appearance: { ...base, slots },
    crop: view === 'portrait' ? (preset.portraitCrop ?? bounds) : bounds,
  }
}
