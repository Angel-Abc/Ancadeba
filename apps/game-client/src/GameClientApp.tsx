import { useEffect, useState } from 'react'
import { useService } from '@ancadeba/ui'
import {
  DataSourceProvider,
  SurfaceRenderer,
  type DataSources,
} from '@ancadeba/engine-ui'
import type { Surface, WidgetDefinition } from '@ancadeba/content'
import { type IOpenSurfaceEffect } from '@ancadeba/engine'
import { messageBusToken, type IMessageBus } from '@ancadeba/utils'
import { bootServiceToken, resourceRepositoryToken } from './services/tokens'
import type { IBootService, IResourceRepository } from './services/types'
import { BootState, type BootProgress } from './services/BootService'
import { ErrorSurface } from './widgets/ErrorSurface'

/**
 * Renders a surface by ID with the given data sources.
 */
function renderSurfaceById(
  resourceRepository: IResourceRepository,
  surfaceId: string,
  dataSources: DataSources,
): React.JSX.Element {
  const surface = resourceRepository.getSurface(surfaceId)
  if (!surface) {
    return <ErrorSurface message={`Surface not found: ${surfaceId}`} />
  }

  return renderSurface(
    surface,
    resourceRepository.getWidgetDefinitions(),
    dataSources,
  )
}

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
 * Main game client application shell.
 * Manages boot lifecycle and surface transitions following the data-driven architecture.
 */
export function GameClientApp(): React.JSX.Element {
  const bootService = useService<IBootService>(bootServiceToken)
  const messageBus = useService<IMessageBus>(messageBusToken)
  const resourceRepository = useService<IResourceRepository>(
    resourceRepositoryToken,
  )

  const [bootProgress, setBootProgress] = useState<BootProgress>(
    bootService.getProgress(),
  )
  const [currentSurfaceId, setCurrentSurfaceId] = useState<string | null>(null)

  useEffect(() => {
    // Subscribe to boot progress updates
    const unsubscribe = bootService.subscribe((progress: BootProgress) => {
      setBootProgress(progress)
    })

    // Subscribe to OpenSurface effects
    const unsubscribeEffects = messageBus.subscribe(
      'OpenSurface',
      (payload) => {
        const effect = payload as IOpenSurfaceEffect
        const surface = resourceRepository.getSurface(effect.surfaceId)
        if (!surface) {
          console.error(
            `[GameClientApp] Surface not found: ${effect.surfaceId}`,
          )
          return
        }
        setCurrentSurfaceId(effect.surfaceId)
      },
    )

    // Start initialization
    bootService.initialize().catch((error) => {
      // Error is handled in BootService but we need to ensure the error state is set
      console.error('[GameClientApp] Initialization failed:', error)
    })

    return () => {
      unsubscribe()
      unsubscribeEffects()
    }
  }, [bootService, messageBus, resourceRepository])

  // Render appropriate surface based on boot state
  switch (bootProgress.state) {
    case BootState.Booting:
    case BootState.Loading:
      return renderBootSurface(resourceRepository, bootProgress)

    case BootState.Error:
      return <ErrorSurface message={bootProgress.message} />

    case BootState.Ready:
      // Render current surface if set, otherwise show error
      if (currentSurfaceId) {
        return renderSurfaceById(resourceRepository, currentSurfaceId, {})
      }
      return <ErrorSurface message="No surface selected" />

    default:
      return <ErrorSurface message="Unknown boot state" />
  }
}
