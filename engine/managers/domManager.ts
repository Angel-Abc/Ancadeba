/**
 * Manages interactions with the browser DOM such as injecting style sheets
 * and updating the document title. All DOM mutations for the application
 * should be routed through this manager to keep concerns centralized.
 */
import { Token, token } from '@ioc/token'

/**
 * Contract for components capable of manipulating the DOM.
 */
export interface IDomManager {
    /**
     * Ensures the provided style sheet is added to the document.
     *
     * @param path - Path to the CSS file to append.
     */
    setCssFile(path: string): void

    /**
     * Updates the document's title.
     *
     * @param title - New title to set on the document.
     */
    setTitle(title: string): void
}

export const domManagerToken = token<IDomManager>('DomManager')
export const domManagerDependencies: Token<unknown>[] = []

/**
 * Default implementation of {@link IDomManager} that targets the global
 * `document` object when available.
 */
export class DomManager implements IDomManager {
    private writtenCssFiles: Set<string>
    private document?: Document

    /**
     * Creates a new {@link DomManager}.
     *
     * @param doc - Optional `Document` to manipulate. If omitted, the global
     * `document` is used when running in a browser context.
     */
    constructor(doc?: Document | null) {
        if (doc !== undefined) {
            this.document = doc || undefined
        } else if (typeof document !== 'undefined') {
            this.document = document
        }
        this.writtenCssFiles = new Set()
    }

    /**
     * Appends a CSS file to the document head, avoiding re-insertion if the
     * file has already been added to the document.
     *
     * @param path - Path of the style sheet to include.
     */
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

    /**
     * Sets the document's title.
     *
     * @param title - Text to use as the document title.
     */
    public setTitle(title: string): void {
        if (!this.document) return
        this.document.title = title
    }
}
