import { useEffect, useState } from 'react'
import { useService } from '@ancadeba/ui'
import { bootServiceToken, type IBootService } from './services/types'
import { BootState, type BootProgress } from './services/BootService'
import { BootSurface } from './widgets/BootSurface'
import { ErrorSurface } from './widgets/ErrorSurface'
import { GameplaySurface } from './widgets/GameplaySurface'

/**
 * Main game client application shell.
 * Manages boot lifecycle and surface transitions following the data-driven architecture.
 */
export function GameClientApp(): React.JSX.Element {
  const bootService = useService<IBootService>(bootServiceToken)

  const [bootProgress, setBootProgress] = useState<BootProgress>(
    bootService.getProgress(),
  )

  useEffect(() => {
    // Subscribe to boot progress updates
    const unsubscribe = bootService.subscribe((progress: BootProgress) => {
      setBootProgress(progress)
    })

    // Start initialization
    bootService.initialize().catch(() => {
      // Error is already handled in BootService and logged
    })

    return unsubscribe
  }, [bootService])

  // Render appropriate surface based on boot state
  switch (bootProgress.state) {
    case BootState.Booting:
    case BootState.Loading:
      return (
        <BootSurface
          message={bootProgress.message}
          progress={bootProgress.progress}
        />
      )

    case BootState.Error:
      return <ErrorSurface message={bootProgress.message} />

    case BootState.Ready:
      return <GameplaySurface />

    default:
      return <ErrorSurface message="Unknown boot state" />
  }
}
