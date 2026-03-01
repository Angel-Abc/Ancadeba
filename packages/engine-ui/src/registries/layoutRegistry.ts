import type { LayoutComponent } from './types'
import { Registry } from './registry'

export class LayoutRegistry extends Registry<LayoutComponent> {
  constructor(entries: Record<string, LayoutComponent> = {}) {
    super(entries)
  }
}
