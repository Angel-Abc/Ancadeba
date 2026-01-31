import { useEffect, useState } from 'react'
import { useService } from '@ancadeba/ui'
import {
  DataSourceProvider,
  SurfaceRenderer,
  type DataSources,
} from '@ancadeba/engine-ui'
import type { Surface, WidgetDefinition } from '@ancadeba/content'
import { bootServiceToken, resourceRepositoryToken } from './services/tokens'
import type { IBootService, IResourceRepository } from './services/types'
import { BootState, type BootProgress } from './services/BootService'
import { ErrorSurface } from './widgets/ErrorSurface'

/**
 * Renders a surface with the given data sources.
 */
function renderSurface(
  surface: Surface,
  widgetDefinitions: Record<string, WidgetDefinition>,
  dataSources: DataSources,
): React.JSX.Element {
  return (
    <DataSourceProvider dataSources={dataSources}>
      <SurfaceRenderer
        surface={surface}
        widgetDefinitions={widgetDefinitions}
      />
    </DataSourceProvider>
  )
}

/**
 * Renders the boot/loading surface.
 */
function renderBootSurface(
  resourceRepository: IResourceRepository,
  bootProgress: BootProgress,
): React.JSX.Element {
  const surface = resourceRepository.getBootSurface()
  if (!surface) {
    return <div />
  }

  return renderSurface(surface, resourceRepository.getWidgetDefinitions(), {
    'boot:progress': {
      message: bootProgress.message,
      progress: bootProgress.progress,
    },
  })
}

/**
 * Renders the gameplay surface.
 */
function renderGameplaySurface(
  resourceRepository: IResourceRepository,
): React.JSX.Element {
  const gameplaySurface = resourceRepository.getSurface('gameplay')
  if (!gameplaySurface) {
    return <ErrorSurface message="Gameplay surface not found" />
  }

  // TODO: Connect to actual ECS projections and world data
  return renderSurface(
    gameplaySurface,
    resourceRepository.getWidgetDefinitions(),
    {
      // Will be populated with actual game data sources
    },
  )
}

/**
 * Main game client application shell.
 * Manages boot lifecycle and surface transitions following the data-driven architecture.
 */
export function GameClientApp(): React.JSX.Element {
  const bootService = useService<IBootService>(bootServiceToken)
  const resourceRepository = useService<IResourceRepository>(
    resourceRepositoryToken,
  )

  const [bootProgress, setBootProgress] = useState<BootProgress>(
    bootService.getProgress(),
  )

  useEffect(() => {
    // Subscribe to boot progress updates
    const unsubscribe = bootService.subscribe((progress: BootProgress) => {
      setBootProgress(progress)
    })

    // Start initialization
    bootService.initialize().catch((error) => {
      // Error is handled in BootService but we need to ensure the error state is set
      console.error('[GameClientApp] Initialization failed:', error)
    })

    return unsubscribe
  }, [bootService])

  // Render appropriate surface based on boot state
  switch (bootProgress.state) {
    case BootState.Booting:
    case BootState.Loading:
      return renderBootSurface(resourceRepository, bootProgress)

    case BootState.Error:
      return <ErrorSurface message={bootProgress.message} />

    case BootState.Ready:
      return renderGameplaySurface(resourceRepository)

    default:
      return <ErrorSurface message="Unknown boot state" />
  }
}
