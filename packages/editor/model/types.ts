export type InitialData = {
  language: string
  startPage: string
}

export type EditorGame = {
  title: string
  description: string
  version: string
  initialData: InitialData
  languages: Record<string, string[]>
  pages: Record<string, string>
  maps: Record<string, string>
  tiles: Record<string, string>
  dialogs: Record<string, string>
  actions: string[]
  virtualKeys: string[]
  virtualInputs: string[]
  cssFiles: string[]
  tags: string[]
  itemDefinitions: string[]
}

export type GameModelState = {
  loading: boolean
  error: string | null
  dirty: boolean
  game: EditorGame | null
}

