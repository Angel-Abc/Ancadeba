import type { Game as GameData } from '@loader/data/game'
import { type Game } from '@loader/schema/game'

export function mapGame(game: Game, basePath: string): GameData {
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
        dialogs: game.dialogs,
        tiles: game.tiles,
        handlers: game.handlers,
        virtualKeys: game['virtual-keys'],
        virtualInputs: game['virtual-inputs'],
        cssFiles: game.styling.map(cssFile => `${basePath}/${cssFile}`)
    }
}
