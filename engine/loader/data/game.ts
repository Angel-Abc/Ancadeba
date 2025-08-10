export type InitialData = {
    language: string
    startPage: string
}

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
    handlers: string[],
    virtualKeys: string[],
    virtualInputs: string[]
}
