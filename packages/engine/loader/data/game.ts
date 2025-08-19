/**
 * Minimal information required to bootstrap a game.
 *
 * @property language  Default language identifier.
 * @property startPage Identifier of the first page to load.
 */
export type InitialData = {
    language: string
    startPage: string
}

/**
 * Top level structure describing a game and its assets.
 *
 * @property title        Game title displayed to players.
 * @property description  Short description of the game.
 * @property version      Semantic version of the game data.
 * @property initialData  Bootstrapping information such as language and start page.
 * @property languages    Mapping of language ids to paths for language data.
 * @property pages        Mapping of page ids to file paths.
 * @property maps         Mapping of map ids to file paths.
 * @property tiles        Mapping of tile set ids to file paths.
 * @property dialogs      Mapping of dialog set ids to file paths.
 * @property actions      List of action script paths to preload.
 * @property virtualKeys  List of virtual key definitions to load.
 * @property virtualInputs List of virtual input definitions to load.
 * @property cssFiles     Stylesheets that should be included for the game.
 */
export type Game = {
    title: string
    description: string
    version: string
    initialData: InitialData
    languages: Record<string, string[]>
    pages: Record<string, string>
    maps: Record<string, string>
    tiles: Record<string, string>
    dialogs: Record<string, string>
    actions: string[],
    virtualKeys: string[],
    virtualInputs: string[],
    cssFiles: string[]
}
