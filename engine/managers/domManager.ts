import { token } from '@ioc/token'

export interface IDomManager {
    setCssFile: (path: string) => void
}

export const domManagerToken = token<IDomManager>('DomManager')
export const domManagerDependencies = []

export class DomManager implements IDomManager {
    private writtenCssFiles: Set<string>

    constructor() {
        this.writtenCssFiles = new Set()
    }

    public setCssFile(path: string): void {
        if (this.writtenCssFiles.has(path)) return

        if (document.head.querySelector(`link[href="${path}"]`)) {
            this.writtenCssFiles.add(path)
            return
        }

        const linkElement: HTMLLinkElement = document.createElement('link')
        linkElement.rel = 'stylesheet'
        linkElement.href = path
        document.head.appendChild(linkElement)
        this.writtenCssFiles.add(path)
    }
}
