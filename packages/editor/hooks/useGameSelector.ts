import { useSyncExternalStore } from 'react'
import { useGameModel } from './useGameModel'
import type { GameModelState } from '@editor/model/types'

export function useGameSelector<T>(selector: (state: GameModelState) => T): T {
  const model = useGameModel()
  return useSyncExternalStore(
    (listener) => model.subscribe(listener),
    () => selector(model.get())
  )
}
