import {
  assembleGameContent,
  parseGameManifest,
  parseItemsFile,
  parseLocationsFile,
  type RuntimeGameContent,
} from '@angelabc/ancadeba-content'

async function loadJson(path: string): Promise<unknown> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(
      `Could not load ${path}: ${response.status} ${response.statusText}`,
    )
  }

  return response.json()
}

export async function loadGame(): Promise<RuntimeGameContent> {
  const manifestValue = await loadJson('/game/game.json')
  const manifest = parseGameManifest(manifestValue)

  const locationsValue = await loadJson(`/game/${manifest.content.locations}`)
  const locationsFile = parseLocationsFile(locationsValue)

  const itemsValue = await loadJson(`/game/${manifest.content.items}`)
  const itemsFile = parseItemsFile(itemsValue)

  return assembleGameContent(manifest, locationsFile, itemsFile)
}
