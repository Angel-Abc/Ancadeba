export interface ActionInformation {
  readonly label: string
  readonly description: string
  readonly reason: string
}

/** Scene-owned presentation state shared by action controls and information panels. */
export class ActionInfo {
  private readonly sources = new Map<symbol, ActionInformation>()
  private readonly hovered = new Set<symbol>()
  private readonly focused = new Set<symbol>()
  private readonly order = new Map<symbol, number>()
  private sequence = 0
  private readonly listeners = new Set<() => void>()
  private current: ActionInformation | undefined

  get value(): ActionInformation | undefined {
    return this.current
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  update(source: symbol, information: ActionInformation | undefined): void {
    if (information) this.sources.set(source, information)
    else {
      this.sources.delete(source)
      this.hovered.delete(source)
      this.focused.delete(source)
      this.order.delete(source)
    }

    this.notify()
  }

  hover(source: symbol, active: boolean): void {
    this.hovered.delete(source)

    if (active && this.sources.has(source)) {
      this.hovered.add(source)
      this.order.set(source, ++this.sequence)
    }

    this.notify()
  }

  focus(source: symbol, active: boolean): void {
    this.focused.delete(source)

    if (active && this.sources.has(source)) {
      this.focused.add(source)
      this.order.set(source, ++this.sequence)
    }

    this.notify()
  }

  private notify(): void {
    const source = [...new Set([...this.hovered, ...this.focused])]
      .sort((left, right) => this.order.get(left)! - this.order.get(right)!)
      .at(-1)

    const next = source ? this.sources.get(source) : undefined

    if (
      this.current?.label === next?.label &&
      this.current?.description === next?.description &&
      this.current?.reason === next?.reason
    )
      return
    this.current = next

    for (const listener of this.listeners) listener()
  }
}
