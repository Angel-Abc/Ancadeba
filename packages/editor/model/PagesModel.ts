import { Token, token } from '@ioc/token'
import { Page } from '@loader/schema/page'
import { ILogger, loggerToken } from '@utils/logger'

export interface IPageModel {
    get id(): string
    get file(): string
    get page(): Page | null
}

export interface IPagesModel {
    get pages(): IPageModel[]
}

export type IPagesModelSet = IPagesModel & {
    setAvailablePages(pages: string[]): void
    setPage(id: string, file: string, page: Page): void
}

const logName = 'PagesModel'
export const pagesModelToken = token<IPagesModel>(logName)
export const pagesModelDependencies: Token<unknown>[] = [
    loggerToken
]

export class PagesModel implements IPagesModelSet {
    private _pages: IPageModel[] | null = null

    constructor(
        private logger: ILogger
    ) {}

    public setAvailablePages(pages: string[]): void {
        // Initialize list with page ids, file empty and page null
        this._pages = pages.map(id => ({
            get id() { return id },
            get file() { return '' },
            get page() { return null }
        }))
    }

    public setPage(id: string, file: string, page: Page): void {
        const list = this.pages
        const idx = list.findIndex(p => p.id === id)
        const entry: IPageModel = {
            get id() { return id },
            get file() { return file },
            get page() { return page }
        }
        if (idx >= 0) {
            list[idx] = entry
        } else {
            list.push(entry)
        }
    }

    public get pages(): IPageModel[] {
        if (this._pages !== null) return this._pages
        const error = this.logger.error(logName, 'No pages are set!')
        throw new Error(error)
    }
}

