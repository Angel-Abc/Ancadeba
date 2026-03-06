import {
  IWidgetDefinitionProvider,
  widgetDefinitionProviderToken,
} from '@ancadeba/engine'
import type { Widget } from '@ancadeba/content'
import { useService } from '@ancadeba/ui'
import { useEffect, useState } from 'react'
import { widgetRegistryToken } from '../../registries/tokens'
import type { IWidgetRegistry } from '../../registries/types'

type WidgetSlotProps = {
  widgetId: string
}

export function WidgetSlot({
  widgetId,
}: WidgetSlotProps): React.JSX.Element | null {
  const widgetDefinitionProvider = useService<IWidgetDefinitionProvider>(
    widgetDefinitionProviderToken,
  )
  const widgetRegistry = useService<IWidgetRegistry>(widgetRegistryToken)
  const [widget, setWidget] = useState<Widget | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    setWidget(null)
    setError(null)

    const loadWidgetDefinition = async (): Promise<void> => {
      try {
        const nextWidget =
          await widgetDefinitionProvider.getWidgetDefinition(widgetId)
        if (!isMounted) {
          return
        }
        setWidget(nextWidget)
      } catch (nextError) {
        if (!isMounted) {
          return
        }
        const message =
          nextError instanceof Error
            ? nextError.message
            : 'Failed to load widget definition'
        setError(message)
      }
    }

    void loadWidgetDefinition()

    return () => {
      isMounted = false
    }
  }, [widgetDefinitionProvider, widgetId])

  if (error) {
    return <div>{error}</div>
  }

  if (!widget) {
    return null
  }

  const renderedWidget = widgetRegistry.render(widget)
  if (!renderedWidget) {
    return <div>Widget {widget.type} not found</div>
  }

  return renderedWidget
}
