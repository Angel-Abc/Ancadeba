import { Token, token } from '@ioc/token'

export interface ITurnScheduler {
    onQueueEmpty(): void
}

export const turnSchedulerToken = token<ITurnScheduler>('TurnScheduler')
export const turnSchedulerDependencies: Token<unknown>[] = []

export class TurnScheduler implements ITurnScheduler {
    public onQueueEmpty(): void {
        // no-op for now
    }
}

