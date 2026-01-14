import { z } from 'zod'

/**
 * Defines a cell in the appearance grid.
 * Cells can span multiple rows/columns to create combined rectangular areas.
 *
 * Example: A torso cell might span 2 rows and 2 columns:
 * { row: 1, column: 0, rowSpan: 2, columnSpan: 2, slotId: 'torso', name: 'appearance.slot.torso' }
 */
export const appearanceCellSchema = z.object({
  /** Starting row position (0-indexed) */
  row: z.number().int().nonnegative(),
  /** Starting column position (0-indexed) */
  column: z.number().int().nonnegative(),
  /** Number of rows this cell spans (default: 1) */
  rowSpan: z.number().int().positive().default(1),
  /** Number of columns this cell spans (default: 1) */
  columnSpan: z.number().int().positive().default(1),
  /** Unique identifier for this slot within the category */
  slotId: z.string(),
  /** Translation key for the slot display name */
  name: z.string(),
  /** Optional constraints or rules for this slot */
  constraints: z
    .object({
      /** Whether this slot is required to be filled */
      required: z.boolean().optional(),
      /** Allowed appearance tags for this slot */
      allowedTags: z.array(z.string()).optional(),
    })
    .optional(),
})

/**
 * Defines an appearance category with its grid layout.
 *
 * Example JSON:
 * {
 *   "id": "armor",
 *   "name": "appearance.category.armor.name",
 *   "description": "appearance.category.armor.description",
 *   "gridRows": 5,
 *   "gridColumns": 3,
 *   "cells": [
 *     { "row": 0, "column": 1, "rowSpan": 1, "columnSpan": 1, "slotId": "head", "name": "appearance.slot.head" },
 *     { "row": 1, "column": 0, "rowSpan": 2, "columnSpan": 3, "slotId": "torso", "name": "appearance.slot.torso" },
 *     { "row": 3, "column": 0, "rowSpan": 1, "columnSpan": 3, "slotId": "legs", "name": "appearance.slot.legs" },
 *     { "row": 4, "column": 1, "rowSpan": 1, "columnSpan": 1, "slotId": "feet", "name": "appearance.slot.feet" }
 *   ]
 * }
 */
export const appearanceCategorySchema = z.object({
  /** Unique identifier for the category */
  id: z.string(),
  /** Translation key for category name */
  name: z.string(),
  /** Translation key for category description */
  description: z.string(),
  /** Number of rows in the grid layout */
  gridRows: z.number().int().positive(),
  /** Number of columns in the grid layout */
  gridColumns: z.number().int().positive(),
  /** Array of cell definitions that make up the grid */
  cells: z.array(appearanceCellSchema).min(1),
  /** Optional ordering priority for display */
  displayOrder: z.number().int().nonnegative().default(0),
})

export type AppearanceCategory = z.infer<typeof appearanceCategorySchema>
export type AppearanceCell = z.infer<typeof appearanceCellSchema>
