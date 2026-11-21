import { z } from 'zod'
import {
  assetIdSchema as id,
  assertGraphicReference,
  boundsSchema,
  colorsSchema,
  graphicAppearanceSchema,
  slotAppearanceSchema,
  type AssetCatalog,
  type GraphicAppearance,
  type SlotAppearance,
} from './assets.js'
import type { InventoryDefinition } from './inventory.js'

const selection = {
  palette: id.optional(),
  visible: z.boolean().optional(),
  colors: colorsSchema.optional(),
  bindings: slotAppearanceSchema.shape.bindings,
}

const slotOverride = z.strictObject({
  ...selection,
  part: slotAppearanceSchema.shape.part,
  partBinding: slotAppearanceSchema.shape.partBinding,
})

const overrides = z.strictObject({
  ...selection,
  slots: z.record(id, slotOverride).optional(),
})

export const characterReferenceSchema = z.strictObject({ character: id })
export const characterViewKindSchema = z.enum(['full-body', 'portrait'])

export const appearanceLibrarySchema = z.strictObject({
  presets: z.record(
    id,
    z.strictObject({
      visual: id,
      appearance: graphicAppearanceSchema.prefault({}),
      portraitCrop: boundsSchema.optional(),
      equipment: z.record(id, id).default({}),
    }),
  ),
  characters: z.record(
    id,
    z.strictObject({
      preset: id,
      overrides: overrides.optional(),
      owner: id.optional(),
    }),
  ),
})

export type AppearanceLibrary = z.infer<typeof appearanceLibrarySchema>

export type CharacterViewKind = z.infer<typeof characterViewKindSchema>

function applySelection(base: SlotAppearance, patch: z.infer<typeof slotOverride>): SlotAppearance {
  const bindings = {
    ...base.bindings,
    colors: { ...base.bindings?.colors, ...patch.bindings?.colors },
  }

  for (const property of ['palette', 'visible'] as const) {
    const binding = patch.bindings?.[property]

    if (binding) bindings[property] = binding
    else if (patch[property] !== undefined) delete bindings[property]
  }

  for (const color of Object.keys(patch.colors ?? {}))
    if (!patch.bindings?.colors[color]) delete bindings.colors[color]

  const result = {
    ...base,
    visible: patch.visible ?? base.visible,
    palette: patch.palette ?? base.palette,
    colors: { ...base.colors, ...patch.colors },
    bindings,
  }

  if (patch.part !== undefined) {
    result.part = patch.part
    delete result.partBinding
  }

  if (patch.partBinding) result.partBinding = patch.partBinding

  return result
}

export function characterAppearance(
  base: GraphicAppearance,
  patch?: z.infer<typeof overrides>,
): GraphicAppearance {
  if (!patch) return base
  const slots = { ...base.slots }

  for (const [slot, change] of Object.entries(patch.slots ?? {}))
    slots[slot] = applySelection(slots[slot] ?? { visible: true, colors: {} }, change)

  return { ...applySelection(base, patch), slots }
}

export function appearanceIssues(
  library?: AppearanceLibrary,
  assets?: AssetCatalog,
  inventory?: InventoryDefinition,
) {
  const issues: { file: string; path: string[]; message: string }[] = []

  if (!library) return issues

  const add = (path: string[], message: string) =>
    issues.push({ file: 'game.json', path: ['appearances', ...path], message })

  const check = (path: string[], visual: string, appearance: GraphicAppearance) => {
    if (!assets) return

    const validate = (location: string[], selection: GraphicAppearance) => {
      try {
        assertGraphicReference(assets, visual, selection)
      } catch (error) {
        add(location, error instanceof Error ? error.message : String(error))
      }
    }

    validate(path, { ...appearance, slots: {} })

    for (const [slot, selection] of Object.entries(appearance.slots)) {
      const location = [...path, 'slots', slot]
      const allowed = assets.compositions[visual]?.slots[slot]?.parts

      if (selection.part && allowed && !allowed.includes(selection.part))
        add([...location, 'part'], 'Part ' + selection.part + ' is not allowed in slot ' + slot)
      else validate(location, { ...appearance, slots: { [slot]: selection } })
    }
  }

  for (const [key, preset] of Object.entries(library.presets)) {
    const path = ['presets', key]

    if (
      !assets ||
      ![assets.images, assets.parts, assets.compositions].some((collection) =>
        Object.hasOwn(collection, preset.visual),
      )
    ) {
      add([...path, 'visual'], 'Unknown character artwork: ' + preset.visual)
      continue
    }

    check([...path, 'appearance'], preset.visual, preset.appearance)
    const composition = assets?.compositions[preset.visual]

    const bounds = (composition ?? assets?.parts[preset.visual] ?? assets?.images[preset.visual])
      ?.bounds

    const crop = preset.portraitCrop

    if (
      crop &&
      bounds &&
      (crop.x < bounds.x ||
        crop.y < bounds.y ||
        crop.x + crop.width > bounds.x + bounds.width ||
        crop.y + crop.height > bounds.y + bounds.height)
    )
      add([...path, 'portraitCrop'], 'Choose a portrait crop inside the artwork bounds')
    const targets = new Set<string>()

    for (const [slot, target] of Object.entries(preset.equipment)) {
      const location = [...path, 'equipment', slot]
      const mapped = composition?.slots[target]

      if (!mapped) add(location, 'Unknown composition slot: ' + target)

      if (targets.has(target)) add(location, 'Composition slots may only be mapped once')
      targets.add(target)
    }
  }

  for (const [key, character] of Object.entries(library.characters)) {
    const path = ['characters', key]

    const preset =
      Object.hasOwn(library.presets, character.preset) && library.presets[character.preset]

    if (!preset) {
      add([...path, 'preset'], 'Unknown appearance preset: ' + character.preset)
      continue
    }

    if (character.overrides)
      check(
        [...path, 'overrides'],
        preset.visual,
        characterAppearance(preset.appearance, character.overrides),
      )

    if (!character.owner) continue

    const owner =
      inventory &&
      Object.hasOwn(inventory.owners, character.owner) &&
      inventory.owners[character.owner]

    if (!owner) {
      add([...path, 'owner'], 'Unknown inventory owner: ' + character.owner)
      continue
    }

    for (const [slot, target] of Object.entries(preset.equipment)) {
      if (!Object.hasOwn(owner.equipmentSlots, slot))
        add([...path, 'owner'], 'Unknown equipment slot: ' + slot)
      const allowed = assets?.compositions[preset.visual]?.slots[target]?.parts

      for (const item of Object.values(inventory!.itemTypes)) {
        if (
          allowed &&
          item.wornPart &&
          item.equipmentSlots.includes(slot) &&
          !allowed.includes(item.wornPart)
        )
          add(
            ['presets', character.preset, 'equipment', slot],
            'Incompatible worn part: ' + item.wornPart,
          )
      }
    }
  }

  return issues
}
