import { Token, token } from '@ioc/token'

export interface IDomManager {
    setCssFile(path: string): void
    setTitle(title: string): void
}

export const domManagerToken = token<IDomManager>('DomManager')
export const domManagerDependencies: Token<unknown>[] = []

export class DomManager implements IDomManager {
    private writtenCssFiles: Set<string>
    private document?: Document

    constructor(doc?: Document | null) {
        if (doc !== undefined) {
            this.document = doc || undefined
        } else if (typeof document !== 'undefined') {
            this.document = document
        }
        this.writtenCssFiles = new Set()
    }

    public setCssFile(path: string): void {
        if (!this.document) return
        if (this.writtenCssFiles.has(path)) return

        if (this.document.head.querySelector(`link[href="${path}"]`)) {
            this.writtenCssFiles.add(path)
            return
        }

        const linkElement: HTMLLinkElement = this.document.createElement('link')
        linkElement.rel = 'stylesheet'
        linkElement.href = path
        this.document.head.appendChild(linkElement)
        this.writtenCssFiles.add(path)
    }

    public setTitle(title: string): void {
        if (!this.document) return
        this.document.title = title
    }
}
