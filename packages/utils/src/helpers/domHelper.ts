import { Token, token } from '../ioc/token'

export interface IDomHelper {
  setTitle(title: string): void
}

const logName = 'utils/helpers/DomHelper'
export const domHelperToken = token<IDomHelper>(logName)
export class DomHelper implements IDomHelper {
  constructor(private readonly document: Document) {}

  setTitle(title: string): void {
    this.document.title = title
  }
}
