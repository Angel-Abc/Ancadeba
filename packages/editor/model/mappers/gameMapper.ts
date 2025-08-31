import type { Game } from '@loader/schema/game'
import type { EditorGame } from '@editor/model/types'

export function mapSchemaToEditor(game: Game, basePath: string): EditorGame {
  return {
    title: game.title,
    description: game.description,
    version: game.version,
    initialData: {
      language: game['initial-data'].language,
      startPage: game['initial-data']['start-page']
    },
    languages: game.languages,
    pages: game.pages,
    maps: game.maps,
    tiles: game.tiles,
    dialogs: game.dialogs,
    actions: game.actions,
    virtualKeys: game['virtual-keys'],
    virtualInputs: game['virtual-inputs'],
    cssFiles: game.styling.map(s => `${basePath}/${s}`),
    tags: game.tags,
    itemDefinitions: game['item-definitions']
  }
}

