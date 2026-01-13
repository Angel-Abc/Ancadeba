import { LogLevel } from './types'

const currentLevel = LogLevel.debug

const enabledCategories = new Set<string>()

export function isLevelEnabled(level: LogLevel): boolean {
  return level >= currentLevel
}

export function isCategoryEnabled(category?: string): boolean {
  return (
    enabledCategories.size === 0 ||
    category === undefined ||
    enabledCategories.has(category)
  )
}
