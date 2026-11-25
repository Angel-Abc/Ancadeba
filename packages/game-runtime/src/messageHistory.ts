import { messageHistoryCapacity, type MessageHistoryEntry } from '@ancadeba/schemas'

/** Chronological snapshots of what the player saw, owned by one playthrough. */
export class GameMessageHistory {
  private retained: readonly MessageHistoryEntry[] = []

  get entries(): readonly MessageHistoryEntry[] {
    return this.retained
  }

  restore(entries: readonly MessageHistoryEntry[]): void {
    this.retained = Object.freeze(
      entries.slice(-messageHistoryCapacity).map((entry) => Object.freeze({ ...entry })),
    )
  }

  append(kind: MessageHistoryEntry['kind'], texts: readonly string[]): void {
    if (!texts.length) return
    const added = texts.map((text) => Object.freeze({ kind, text }))
    this.retained = Object.freeze([...this.retained, ...added].slice(-messageHistoryCapacity))
  }

  /** The selected reply precedes any narration produced by its effects. */
  recordChoice(text: string, commitEffects: () => void): void {
    const previous = this.retained
    this.append('choice', [text])

    try {
      commitEffects()
    } catch (error) {
      this.retained = previous
      throw error
    }
  }
}
