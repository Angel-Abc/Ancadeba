import {
  ISurfaceDefinitionProvider,
  MESSAGE_ENGINE_SURFACE_DATA_CHANGED,
  surfaceDefinitionProviderToken,
} from '@ancadeba/engine'
import { useService } from '@ancadeba/ui'
import { useEffect, useState } from 'react'
import { ILayoutRegistry } from '../registries/types'
import { layoutRegistryToken } from '../registries/tokens'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'

type Surface = Awaited<
  ReturnType<ISurfaceDefinitionProvider['getSurfaceDefinition']>
>

const SurfaceVisual = (): React.JSX.Element => {
  const surfaceDefinitionProvider = useService<ISurfaceDefinitionProvider>(
    surfaceDefinitionProviderToken,
  )
  const messageBus = useService<IMessageBus>(messageBusToken)
  const layoutRegistry = useService<ILayoutRegistry>(layoutRegistryToken)
  const [surface, setSurface] = useState<Surface | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [surfaceId, setSurfaceId] = useState<string | null>(null)

  useEffect(() => {
    return messageBus.subscribe(
      MESSAGE_ENGINE_SURFACE_DATA_CHANGED,
      (payload) => {
        setSurfaceId((payload as { surfaceId: string }).surfaceId)
      },
    )
  }, [messageBus])

  useEffect(() => {
    let isMounted = true

    setSurface(null)
    setError(null)

    const loadSurfaceDefinition = async (): Promise<void> => {
      if (!surfaceId) {
        return
      }

      try {
        const nextSurface =
          await surfaceDefinitionProvider.getSurfaceDefinition(surfaceId)
        if (!isMounted) {
          return
        }
        setSurface(nextSurface)
      } catch (nextError) {
        if (!isMounted) {
          return
        }
        const message =
          nextError instanceof Error
            ? nextError.message
            : 'Failed to load surface definition'
        setError(message)
      }
    }

    void loadSurfaceDefinition()

    return () => {
      isMounted = false
    }
  }, [surfaceDefinitionProvider, surfaceId])

  if (error) {
    return <div>{error}</div>
  }
  if (!surface) {
    return <div>Loading surface...</div>
  }

  const Layout = layoutRegistry.get(surface.layout.type)
  if (!Layout) {
    return <div>Layout {surface.layout.type} not found</div>
  }

  if (!surface) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <Layout layout={surface.layout} />
    </div>
  )
}

export { SurfaceVisual as Surface }
