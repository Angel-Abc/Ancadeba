import {
  resourceConfigurationToken,
  type IResourceConfiguration,
} from '@ancadeba/content'
import type { Token } from '@ancadeba/utils'
import type { IGameStyleLoader } from './types'

export const gameStyleLoaderDependencies: Token<unknown>[] = [
  resourceConfigurationToken,
]

const GAME_STYLE_ATTRIBUTE = 'data-ancadeba-game-style'

export class GameStyleLoader implements IGameStyleLoader {
  private readonly loadedStyleHrefs = new Set<string>()

  constructor(
    private readonly resourceConfiguration: IResourceConfiguration,
  ) {}

  async loadStyles(stylePaths: readonly string[]): Promise<void> {
    if (stylePaths.length === 0 || typeof document === 'undefined') {
      return
    }

    for (const stylePath of stylePaths) {
      const href = `${this.resourceConfiguration.resourcePath}/${stylePath}`
      if (this.loadedStyleHrefs.has(href)) {
        continue
      }

      await this.appendStylesheet(href)
      this.loadedStyleHrefs.add(href)
    }
  }

  private appendStylesheet(href: string): Promise<void> {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute(GAME_STYLE_ATTRIBUTE, href)

    const loadPromise = new Promise<void>((resolve, reject) => {
      link.addEventListener('load', () => resolve(), { once: true })
      link.addEventListener(
        'error',
        () => reject(new Error(`Failed to load game style ${href}`)),
        { once: true },
      )
    })

    document.head.appendChild(link)
    return loadPromise
  }
}
