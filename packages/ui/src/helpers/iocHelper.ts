import { Container } from '@ancadeba/utils'
import { DomHelper, domHelperToken } from './domHelper'

export function registerServices(
  container: Container,
  document: Document
): void {
  container.registerAll([
    {
      token: domHelperToken,
      useFactory: () => new DomHelper(document),
    },
  ])
}
