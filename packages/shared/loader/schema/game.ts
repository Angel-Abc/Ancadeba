import { z } from "zod";

// Validate JSON file paths
const jsonFile = z.string().regex(/\.json$/, "Must be a .json file");

// Validate CSS file paths
const cssFile = z.string().regex(/\.css$/, "Must be a .css file");

// Schema for initial-data
const initialDataSchema = z.object({
  language: z.string(),
  "start-page": z.string(),
});

// Main schema
export const gameSchema = z.object({
  title: z.string(),
  description: z.string(),
  version: z.string(),
  "initial-data": initialDataSchema,

  // Languages: each key = language code, each value = array of JSON file paths
  languages: z.record(z.string(), z.array(jsonFile)),

  // Pages: key = page name, value = file path
  pages: z.record(z.string(), jsonFile),

  // Maps, Tiles, Dialogs: same structure
  maps: z.record(z.string(), jsonFile),
  tiles: z.record(z.string(), jsonFile),
  dialogs: z.record(z.string(), jsonFile),

  // Styling must be CSS files
  styling: z.array(cssFile),

  // Actions must be JSON files
  actions: z.array(jsonFile),

  // Virtual inputs and keys must be JSON files
  "virtual-keys": z.array(jsonFile),
  "virtual-inputs": z.array(jsonFile),

  // Tags
  tags: z.array(jsonFile),

  "item-definitions": z.array(jsonFile)

}).strict(); // Ensures no unknown properties

export type Game = z.infer<typeof gameSchema>;
