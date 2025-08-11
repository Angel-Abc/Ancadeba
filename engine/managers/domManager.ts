import { token } from '@ioc/token'

const writtenCssFiles: Set<string> = new Set()

export interface IDomManager {
    setCssFile: (path: string) => void
}

export const domManagerToken = token<IDomManager>('DomManager')
export const domManagerDependencies = []

export class DomManager implements IDomManager {
    public setCssFile(path: string): void {
        if (writtenCssFiles.has(path)) return
        const linkElement: HTMLLinkElement = document.createElement('link')
        linkElement.rel = 'stylesheet'
        linkElement.href = path
        document.head.appendChild(linkElement)
        writtenCssFiles.add(path)
    }
}
