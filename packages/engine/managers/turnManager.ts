import { Token, token } from '@ioc/token'
import { FINALIZE_END_TURN_MESSAGE, START_END_TURN_MESSAGE } from '@messages/system'
import { IInputSourcesService, inputSourcesServiceToken } from '@services/inputSourcesService'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { CleanUp } from '@utils/types'

/**
 * Interface defining the lifecycle hooks required to manage the end of a turn.
 * Implementations are responsible for registering and removing any listeners
 * needed to respond to turn-related messages.
 */
export interface ITurnManager {
    /**
     * Registers listeners and prepares the manager to handle turn messages.
     * Should be invoked when the engine or owning system is initialised.
     */
    initialize(): void

    /**
     * Unregisters listeners and clears internal state. This is called when the
     * manager is no longer needed or before re-initialisation to avoid
     * duplicate subscriptions.
     */
    cleanup(): void
}

const logName = 'TurnManager'
export const turnManagerToken = token<ITurnManager>(logName)
export const turnManagerDependencies: Token<unknown>[] = [inputSourcesServiceToken, messageBusToken]

/**
 * Coordinates the sequence of operations that occur when a game turn ends.
 * The manager listens for turn-related messages and triggers input updates as
 * the engine transitions between turns.
 */
export class TurnManager implements ITurnManager {
    /** Registered cleanup callbacks for message bus subscriptions. */
    private cleanupFns: CleanUp[] | null = null

    constructor (
        private inputSourcesService: IInputSourcesService,
        private messageBus: IMessageBus
    ){}

    /**
     * Begins listening for messages that signal the end of a turn. This should
     * be called during engine start-up or whenever the manager is re-activated.
     */
    public initialize(): void {
        this.cleanup()
        this.cleanupFns = [
            this.messageBus.registerMessageListener(
                START_END_TURN_MESSAGE,
                () => this.onEndTurnStart()
            ),
            this.messageBus.registerMessageListener(
                FINALIZE_END_TURN_MESSAGE,
                () => this.onEndTurnFinalize()
            )
        ]
    }

    /**
     * Stops listening for turn messages and clears any previously registered
     * listeners. Invoke this when shutting down or before re-initialising to
     * ensure there are no duplicate subscriptions.
     */
    public cleanup(): void {
        const fns = this.cleanupFns
        this.cleanupFns = null
        fns?.forEach(fn => fn())
    }

    /**
     * Handles the initial phase of ending a turn. Any logic here may post
     * additional messages to the bus. Once the state has potentially changed,
     * input sources are refreshed to reflect the new turn.
     */
    private onEndTurnStart(): void {
        this.inputSourcesService.updateInputs()
    }

    /**
     * Executes after all end-of-turn messages have been processed. Use this
     * hook for final cleanup or state persistence that must occur once the
     * message queue is empty.
     */
    private onEndTurnFinalize(): void {
        // Perform any final end-of-turn tasks after the message queue empties,
        // such as persisting state or preparing the next turn.
    }
}
