import { Game } from '@loader/schema/game'

export interface BaseItem {
    type: string
    id: number
    label: string
    children: BaseItem[]
}

export type FileItem = BaseItem & {
    path: string
}

export type RecordItem = BaseItem & {
    key: string
    path: string
}

export type RootItem = BaseItem & {
    type: 'root'
    game: Game
}

export type PagesItem = BaseItem & {
    type: 'pages'
}

export type PageItem = RecordItem & {
    type: 'page'
}

export type LanguagesItem = BaseItem & {
    type: 'languages'
}

export type LanguageItem = BaseItem & {
    type: 'language',
    language: string
}

export type TranslationsItem = FileItem & {
    type: 'translations'
}
