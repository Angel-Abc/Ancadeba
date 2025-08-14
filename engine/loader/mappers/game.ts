import type { Game as GameData } from '@loader/data/game'
import { type Game } from '@loader/schema/game'

/**
 * Map a game definition from the schema to the loader's internal format.
 *
 * The mapper copies general metadata and converts schema properties to their
 * camelCase equivalents (e.g. `initial-data` to `initialData`). Paths to CSS
 * files found in `styling` are prefixed with the provided `basePath` to make
 * them resolvable from the engine.
 *
 * @param game - Game definition as provided by the schema.
 * @param basePath - Base directory used to resolve relative asset paths.
 * @returns Normalized game data ready for loading.
 */
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
        actions: game.actions,
        virtualKeys: game['virtual-keys'],
        virtualInputs: game['virtual-inputs'],
        cssFiles: game.styling.map(cssFile => `${basePath}/${cssFile}`)
    }
}
