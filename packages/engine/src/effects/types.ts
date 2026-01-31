/**
 * Base interface for all effects.
 * Effects are discrete, declarative descriptions of something that should happen
 * as a consequence of game logic but are not game state themselves.
 * Effects are published via the MessageBus.
 */
export interface IEffect {
  /**
   * The type of effect, used as the event name in the message bus.
   */
  type: string
}

/**
 * Effect that requests a surface transition.
 */
export interface IOpenSurfaceEffect extends IEffect {
  type: 'OpenSurface'
  /**
   * The ID of the surface to open.
   */
  surfaceId: string
}
