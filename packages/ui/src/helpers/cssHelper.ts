import { CSSProperties } from 'react'

export type CSSCustomProperties = CSSProperties & {
  [key: `--${string}`]: string
}

const writtenCssFiles = new Set<string>()

export function applyCssFileOnce(document: Document, href: string): void {
  if (writtenCssFiles.has(href)) {
    return
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
  writtenCssFiles.add(href)
}
