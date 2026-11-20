import type { InputData } from './gameData.js'

export interface VirtualInput {
  readonly context: string
  readonly input: string
  readonly phase: 'pressed' | 'released' | 'cancelled'
}

export interface SceneKeyBindings {
  readonly keyboard: ReadonlyMap<string, string>
  /** Explicit remaps take precedence over other bindings while the control is available. */
  readonly preferred?: ReadonlySet<string>
  /** Reserved shortcuts also take precedence over focused controls. */
  readonly reserved?: ReadonlySet<string>
  /** Capture the target at keypress, then run the handler on virtual event delivery. */
  capture(input: string): (() => void) | undefined
}

const emptyInput: InputData = {
  virtualKeys: [],
  keyboard: {},
  contexts: { gameplay: {} },
  initialContext: 'gameplay',
}

export interface IGameInput {
  bindSceneKeys?(bindings: SceneKeyBindings): () => void
  isSceneKey?(code: string): boolean
  isReservedKey?(code: string): boolean
  readonly context: string
  getKeyboardCodes(context: string, input: string): readonly string[]
  subscribeContextChanges(listener: (context: string) => void): () => void
  setContext(id: string): void
  isKeyMapped(code: string): boolean
  pressKey(code: string): boolean
  releaseKey(code: string): boolean
  reset(): void
}

/** Session-owned input state. No host events or automatic bus delivery. */
export class InputController implements IGameInput {
  private readonly keyboard: Map<string, string>
  private readonly contexts: Map<string, Map<string, string>>
  private readonly held = new Map<string, string | undefined>()
  private readonly suppressed = new Set<string>()
  private sceneKeys?:
    | {
        bindings: SceneKeyBindings
        handlers: WeakMap<VirtualInput, () => void>
        unsubscribe: () => void
      }
    | undefined
  private inputs = new Set<string>()
  private activeContext: string
  private disposed = false
  private readonly contextListeners = new Set<(context: string) => void>()

  constructor(
    data: InputData | undefined,
    private readonly messages: {
      publish(topic: 'input.virtual', payload: VirtualInput): void
      subscribe?(topic: 'input.virtual', handle: (event: VirtualInput) => void): () => void
    },
  ) {
    data ??= emptyInput
    this.keyboard = new Map(Object.entries(data.keyboard))
    this.contexts = new Map(
      Object.entries(data.contexts).map(([id, mappings]) => [
        id,
        new Map(Object.entries(mappings)),
      ]),
    )

    if (!this.contexts.has(data.initialContext)) throw new Error('Unknown initial input context')
    this.activeContext = data.initialContext
  }

  get context(): string {
    return this.activeContext
  }

  bindSceneKeys(bindings: SceneKeyBindings): () => void {
    if (this.disposed || !this.messages.subscribe) return () => {}

    this.sceneKeys?.unsubscribe()
    const handlers = new WeakMap<VirtualInput, () => void>()

    const unsubscribe = this.messages.subscribe('input.virtual', (event) => {
      handlers.get(event)?.()
    })

    const scope = { bindings, handlers, unsubscribe }
    this.sceneKeys = scope

    return () => {
      unsubscribe()

      if (this.sceneKeys === scope) this.sceneKeys = undefined
    }
  }

  isSceneKey(code: string): boolean {
    return (
      !this.disposed &&
      (!this.keyboard.has(code) ||
        this.isReservedKey(code) ||
        this.sceneKeys?.bindings.preferred?.has(code) === true) &&
      this.sceneKeys?.bindings.keyboard.has(code) === true
    )
  }

  isReservedKey(code: string): boolean {
    return this.sceneKeys?.bindings.reserved?.has(code) === true
  }

  getKeyboardCodes(context: string, input: string): readonly string[] {
    if (this.disposed) return []
    const codes = new Set(this.keyboard.keys())

    if (this.sceneKeys && context === this.context)
      for (const code of this.sceneKeys.bindings.keyboard.keys()) codes.add(code)

    return [...codes].filter((code) => this.resolveInput(code, context) === input)
  }

  subscribeContextChanges(listener: (context: string) => void): () => void {
    if (this.disposed) return () => {}

    this.contextListeners.add(listener)

    return () => this.contextListeners.delete(listener)
  }

  isKeyMapped(code: string): boolean {
    return !this.disposed && this.resolveInput(code, this.context) !== undefined
  }

  private resolveInput(code: string, context: string): string | undefined {
    if (context === this.context && this.isSceneKey(code))
      return this.sceneKeys?.bindings.keyboard.get(code)
    const key = this.keyboard.get(code)

    return key === undefined ? undefined : this.contexts.get(context)?.get(key)
  }

  setContext(id: string): void {
    if (this.disposed) return

    if (!this.contexts.has(id)) throw new Error(`Unknown input context: ${id}`)

    if (id === this.context) return
    this.cancelInputs()

    for (const code of this.held.keys()) this.suppressed.add(code)
    this.activeContext = id
    const errors: unknown[] = []

    for (const listener of [...this.contextListeners]) {
      if (!this.contextListeners.has(listener)) continue

      try {
        listener(id)
      } catch (error) {
        errors.push(error)
      }
    }

    if (errors.length) throw new AggregateError(errors, 'Input context subscribers failed')
  }

  pressKey(code: string): boolean {
    if (this.disposed) return false
    const input = this.resolveInput(code, this.context)

    if (input === undefined && !this.keyboard.has(code)) return false

    if (!this.held.has(code)) {
      this.held.set(code, input)
      this.reconcile()
    }

    return input !== undefined && !this.suppressed.has(code)
  }

  releaseKey(code: string): boolean {
    if (this.disposed || !this.held.delete(code)) return false
    const accepted = this.isKeyMapped(code) && !this.suppressed.has(code)
    this.suppressed.delete(code)
    this.reconcile()

    return accepted
  }

  reset(): void {
    if (this.disposed) return
    this.cancelInputs()
    this.held.clear()
    this.suppressed.clear()
  }

  dispose(): void {
    this.disposed = true
    this.held.clear()
    this.suppressed.clear()
    this.sceneKeys?.unsubscribe()
    this.sceneKeys = undefined
    this.inputs.clear()
    this.contextListeners.clear()
  }

  private cancelInputs(): void {
    for (const input of this.inputs) this.publish(input, 'cancelled')
    this.inputs.clear()
  }

  private reconcile(): void {
    const next = new Set<string>()

    for (const [code, input] of this.held)
      if (input !== undefined && !this.suppressed.has(code)) next.add(input)

    for (const input of this.inputs) if (!next.has(input)) this.publish(input, 'released')

    for (const input of next) if (!this.inputs.has(input)) this.publish(input, 'pressed')
    this.inputs = next
  }

  private publish(input: string, phase: VirtualInput['phase']): void {
    const event = { context: this.context, input, phase }

    if (phase === 'pressed' && this.sceneKeys) {
      const handle = this.sceneKeys.bindings.capture(input)

      if (handle) this.sceneKeys.handlers.set(event, handle)
    }

    this.messages.publish('input.virtual', event)
  }
}
