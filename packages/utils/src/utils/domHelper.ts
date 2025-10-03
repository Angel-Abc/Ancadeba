import { token } from '../ioc'

export interface IDomHelper {
    setTitle(title: string): void
}

const logName = 'DomHelper'
export const domHelperToken = token<IDomHelper>(logName)
export class DomHelper implements IDomHelper {
    constructor(private document: Document) { 
        // no code here
    }

    setTitle(title: string): void {
        this.document.title = title
    }
}
