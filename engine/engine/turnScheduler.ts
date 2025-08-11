import { Token, token } from '@ioc/token'
import { logDebug } from '@utils/logMessage'

const logName: string = 'TurnScheduler'

export interface ITurnScheduler {
    onQueueEmpty(): void
}

export const turnSchedulerToken = token<ITurnScheduler>('TurnScheduler')
export const turnSchedulerDependencies: Token<unknown>[] = []

export class TurnScheduler implements ITurnScheduler {
    public onQueueEmpty(): void {
        logDebug(logName, 'TurnScheduler: onQueueEmpty called')
    }
}

