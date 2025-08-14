/**
 * Emitted once the engine has finished initialization.
 * Payload: null
 */
export const START_GAME_ENGINE_MESSAGE = 'SYSTEM/START-GAME-ENGINE'

/**
 * Emitted when the turn scheduler begins end-of-turn processing.
 * Payload: null
 */
export const START_END_TURN_MESSAGE = 'SYSTEM/START-END-TURN'

/**
 * Emitted when the turn scheduler finalizes end-of-turn processing.
 * Payload: null
 */
export const FINALIZE_END_TURN_MESSAGE = 'SYSTEM/FINALIZE-END-TURN'

/**
 * Request to switch to a different page.
 * Payload: string page identifier
 */
export const SWITCH_PAGE = 'SYSTEM/SWITCH-PAGE'

/**
 * Indicates the active page has changed.
 * Payload: string page identifier
 */
export const PAGE_SWITCHED = 'SYSTEM/PAGE-SWITCHED'

/**
 * Request to switch to a different map.
 * Payload: string map identifier
 */
export const SWITCH_MAP = 'SYSTEM/SWITCH-MAP'

/**
 * Indicates the active map has changed.
 * Payload: string map identifier
 */
export const MAP_SWITCHED = 'SYSTEM/MAP-SWITCHED'
