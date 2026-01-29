import { currentLevel, enabledCategories } from './configuration'
import { type LogLevel } from './logLevel'

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
