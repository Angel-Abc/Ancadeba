import { token } from '@ancadeba/utils'
import { applyCssFileOnce } from './cssHelper'

export interface IDomHelper {
  setTitle(title: string): void
  addCssFile(path: string): void
}

const logName = 'utils/helpers/DomHelper'
export const domHelperToken = token<IDomHelper>(logName)
export class DomHelper implements IDomHelper {
  constructor(private readonly document: Document) {}

  setTitle(title: string): void {
    this.document.title = title
  }

  addCssFile(path: string): void {
    applyCssFileOnce(this.document, path)
  }
}
