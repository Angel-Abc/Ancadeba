import type { EngineState, IEngine } from '@ancadeba/game-runtime'

export type PreviewStateListener = (state: EngineState, error?: string) => void

export class EditorPreviewController {
  private engine: IEngine | undefined
  private pendingConfirmation: symbol | undefined
  private disposed = false

  constructor(
    private readonly createInstance: (folder: string) => IEngine,
    private readonly onStateChange: PreviewStateListener,
    private readonly confirmPreview: () => boolean | Promise<boolean> = () => true,
  ) {}

  async start(
    folder: string,
    { confirm = true, onStarting }: { confirm?: boolean; onStarting?: () => void } = {},
  ): Promise<void> {
    if (this.disposed || this.engine || this.pendingConfirmation) return

    const accepted = confirm ? this.confirmPreview() : true

    if (accepted === false) return

    if (accepted !== true) {
      const request = Symbol()
      this.pendingConfirmation = request

      try {
        if (!(await accepted) || this.pendingConfirmation !== request) return
      } finally {
        if (this.pendingConfirmation === request) this.pendingConfirmation = undefined
      }
    }

    let engine: IEngine | undefined

    try {
      engine = this.createInstance(folder)
      this.engine = engine
      onStarting?.()
      this.onStateChange('starting')
      await engine.start()

      if (this.disposed || this.engine !== engine) return

      if (engine.state === 'stopped') this.engine = undefined
      this.onStateChange(engine.state)
    } catch (error) {
      if (this.disposed || this.engine !== engine) return
      this.engine = undefined
      engine?.stop()
      this.onStateChange('stopped', error instanceof Error ? error.message : String(error))
    }
  }

  stop(): void {
    if (this.disposed) return
    this.pendingConfirmation = undefined
    const engine = this.engine
    this.engine = undefined

    try {
      engine?.stop()
      this.onStateChange('stopped')
    } catch (error) {
      this.onStateChange('stopped', error instanceof Error ? error.message : String(error))
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.pendingConfirmation = undefined
    const engine = this.engine
    this.engine = undefined
    engine?.stop()
  }
}
