import { z } from 'zod'

/**
 * Defines which slots an appearance fills and their visual representation.
 *
 * Example: A full plate armor might fill all slots with different image layers:
 * {
 *   "slotId": "head",
 *   "image": "armor/plate/helmet.png",
 *   "layer": 10,
 *   "color": "#C0C0C0"
 * }
 */
export const appearanceSlotDataSchema = z.object({
  /** The slot ID this data applies to (must match a slot in the category) */
  slotId: z.string(),
  /** Path to the image file for this slot */
  image: z.string().optional(),
  /** Layer ordering for rendering (higher = rendered on top) */
  layer: z.number().int().default(0),
  /** Optional color tint to apply to the image */
  color: z.string().optional(),
  /** Additional metadata for this slot */
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Defines an individual appearance that can be applied to a character.
 *
 * Example JSON:
 * {
 *   "id": "steel-plate-armor",
 *   "name": "appearance.steel-plate-armor.name",
 *   "description": "appearance.steel-plate-armor.description",
 *   "categoryId": "armor",
 *   "slots": [
 *     { "slotId": "head", "image": "armor/steel-plate/helmet.png", "layer": 10 },
 *     { "slotId": "torso", "image": "armor/steel-plate/chest.png", "layer": 5 },
 *     { "slotId": "legs", "image": "armor/steel-plate/legs.png", "layer": 3 },
 *     { "slotId": "feet", "image": "armor/steel-plate/boots.png", "layer": 2 }
 *   ],
 *   "tags": ["heavy-armor", "metal"],
 *   "requirements": {
 *     "minLevel": 10,
 *     "allowedRaces": ["human", "dwarf"]
 *   }
 * }
 */
export const appearanceSchema = z.object({
  /** Unique identifier for this appearance */
  id: z.string(),
  /** Translation key for appearance name */
  name: z.string(),
  /** Translation key for appearance description */
  description: z.string(),
  /** The category this appearance belongs to */
  categoryId: z.string(),
  /** Array of slot data defining which slots this appearance fills */
  slots: z.array(appearanceSlotDataSchema).min(1),
  /** Optional tags for categorization and filtering */
  tags: z.array(z.string()).default([]),
  /** Optional requirements to use this appearance */
  requirements: z
    .object({
      /** Minimum character level required */
      minLevel: z.number().int().nonnegative().optional(),
      /** Maximum character level allowed */
      maxLevel: z.number().int().positive().optional(),
      /** Allowed races (empty = all allowed) */
      allowedRaces: z.array(z.string()).optional(),
      /** Allowed genders (empty = all allowed) */
      allowedGenders: z.array(z.string()).optional(),
      /** Required flags to be set */
      requiredFlags: z.record(z.string(), z.boolean()).optional(),
    })
    .optional(),
  /** Additional properties for extensibility */
  properties: z.record(z.string(), z.unknown()).optional(),
})

export type Appearance = z.infer<typeof appearanceSchema>
export type AppearanceSlotData = z.infer<typeof appearanceSlotDataSchema>
