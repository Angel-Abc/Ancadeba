import {
  gameSchema,
  sceneSchema,
  mapDefinitionSchema,
  inventorySchema,
  gameRulesSchema,
  formSchema,
  choiceSchema,
  dialogueSchema,
  questSchema,
  levelingProfileSchema,
  combatSourceSchema,
  combatLibrarySchema,
  assetCatalogSchema,
  inputSchema,
} from '@ancadeba/schemas'
import { isPrivateProjectEntry, object } from '@ancadeba/editor-core'

export const resourceDirectories = [
  ['scenes', 'scenes', sceneSchema],
  ['maps', 'maps', mapDefinitionSchema],
  ['inventory', 'inventory', inventorySchema],
  ['rules', 'rules', gameRulesSchema],
  ['choices', 'choices', choiceSchema],
  ['forms', 'forms', formSchema],
  ['dialogues', 'dialogues', dialogueSchema],
  ['quests', 'quests', questSchema],
  ['leveling', 'leveling', levelingProfileSchema],
  ['combat', 'combat', combatSourceSchema],
  ['combatLibraries', 'combat-libraries', combatLibrarySchema],
  ['assets', 'assets', assetCatalogSchema],
  ['input', 'input', inputSchema],
] as const

interface DirectoryEntry {
  name: string
  type: 'directory' | 'file' | 'other'
}

interface DirectoryReader {
  list(path: string): Promise<{ entries: DirectoryEntry[] }>
  read(path: string): Promise<Uint8Array>
}

const recoveryDirectories = new Set<string>([
  'languages',
  ...resourceDirectories.map(([, directory]) => directory),
])

async function readJson(
  reader: DirectoryReader,
  directory: string,
  file: string,
): Promise<unknown> {
  const text = Buffer.from(await reader.read(directory ? `${directory}/${file}` : file)).toString(
    'utf8',
  )

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** Inside another game a conventional directory name alone is insufficient evidence of a lost project. */
async function hasSurvivingScene(reader: DirectoryReader, path: string): Promise<boolean> {
  const scenes = path ? `${path}/scenes` : 'scenes'

  for (const entry of (await reader.list(scenes)).entries) {
    if (
      entry.type === 'file' &&
      !isPrivateProjectEntry(entry.name) &&
      entry.name.endsWith('.json') &&
      sceneSchema.safeParse(await readJson(reader, scenes, entry.name)).success
    )
      return true
  }

  return false
}

/**
 * An undefined owner denotes loose workspace folders. Descendants of an established
 * project carry its immediate manifest, or null deeper in its resource tree.
 */
export async function inspectProjectDirectory(
  reader: DirectoryReader,
  path: string,
  owner: unknown,
) {
  const { entries } = await reader.list(path)

  const directories = entries
    .filter((entry) => entry.type === 'directory')
    .map((entry) => entry.name)

  const marker =
    entries.find((entry) => entry.type === 'file' && entry.name === 'game.json') ??
    entries.find((entry) => entry.type === 'file' && entry.name.toLowerCase() === 'game.json')

  const folder = path.split('/').at(-1)?.toLowerCase()
  const resource = resourceDirectories.find(([, directory]) => directory === folder)
  const reference = resource && object(owner)[resource[0]]
  let kind: 'project' | 'recoverable' | 'directory' = 'directory'
  let manifest: unknown

  if (marker) {
    manifest = await readJson(reader, path, marker.name)
    const ids = Array.isArray(reference) ? reference : [reference]
    const referenced = ids.some((id) => typeof id === 'string' && id.toLowerCase() === 'game')

    // A surviving resource also identifies itself when its parent's manifest needs repair.
    // Require a resource-specific field because several schemas have optional collections.
    const resourceDocument =
      resource &&
      Object.keys(object(manifest)).some(
        (key) => !Object.hasOwn(gameSchema.shape, key) && Object.hasOwn(resource[2].shape, key),
      ) &&
      resource[2].safeParse(manifest).success &&
      !gameSchema.safeParse(manifest).success

    if (!referenced && !resourceDocument) kind = 'project'
  } else if (directories.some((child) => recoveryDirectories.has(child))) {
    if (
      owner === undefined ||
      (reference === undefined &&
        directories.includes('scenes') &&
        (await hasSurvivingScene(reader, path)))
    )
      kind = 'recoverable'
  }

  const childOwner =
    kind === 'project' ? manifest : owner === undefined && kind !== 'recoverable' ? undefined : null

  return { entries, directories, manifest, kind, childOwner }
}

export async function inspectProjectPath(reader: DirectoryReader, path: string) {
  let directory = ''
  let current = await inspectProjectDirectory(reader, directory, undefined)

  for (const part of path.split('/').filter(Boolean)) {
    directory = directory ? `${directory}/${part}` : part
    current = await inspectProjectDirectory(reader, directory, current.childOwner)
  }

  return current
}

/** Yields nested project roots to callers, descending only through the selected game's files. */
export async function* walkProjectDirectories(reader: DirectoryReader, root: string) {
  const pending: { directory: string; owner: unknown }[] = [{ directory: '', owner: undefined }]

  for (const { directory, owner } of pending) {
    const path = [root, directory].filter(Boolean).join('/')
    const current = await inspectProjectDirectory(reader, path, owner)
    const nested = directory !== '' && current.kind !== 'directory'
    yield { directory, path, entries: current.entries, nested }

    if (nested) continue

    for (const name of current.directories) {
      if (!isPrivateProjectEntry(name))
        pending.push({
          directory: directory ? `${directory}/${name}` : name,
          owner: current.childOwner ?? null,
        })
    }
  }
}
