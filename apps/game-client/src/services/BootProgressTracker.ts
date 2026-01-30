import { BootState, type BootProgress } from './BootService'
import {
  BootProgressTrackerLogName,
  type IBootProgressTracker,
} from './types'

/**
 * Manages boot progress state and notifies observers of changes.
 * Responsible only for state management and observer pattern implementation.
 */
export class BootProgressTracker implements IBootProgressTracker {
  public static readonly logName: string = BootProgressTrackerLogName

  private state: BootState = BootState.Booting
  private message: string = 'Starting...'
  private progress: number = 0
  private subscribers: Set<(progress: BootProgress) => void> = new Set()

  getState(): BootState {
    return this.state
  }

  getProgress(): BootProgress {
    return {
      state: this.state,
      message: this.message,
      progress: this.progress,
    }
  }

  subscribe(callback: (progress: BootProgress) => void): () => void {
    this.subscribers.add(callback)
    // Immediately notify with current state
    callback(this.getProgress())
    return () => {
      this.subscribers.delete(callback)
    }
  }

  updateProgress(state: BootState, message: string, progress: number): void {
    this.state = state
    this.message = message
    this.progress = progress

    const currentProgress = this.getProgress()
    this.subscribers.forEach((callback) => callback(currentProgress))
  }
}
