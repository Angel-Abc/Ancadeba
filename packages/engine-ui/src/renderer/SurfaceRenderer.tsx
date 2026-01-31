import type React from 'react'
import { useService } from '@ancadeba/ui'
import type { Surface, GridLayout, WidgetDefinition } from '@ancadeba/content'
import { widgetRegistryToken } from '../registry/tokens'
import type { IWidgetRegistry, WidgetProps } from '../registry/types'

/**
 * Props for the SurfaceRenderer component.
 */
interface SurfaceRendererProps {
  /**
   * The surface definition to render.
   */
  surface: Surface
  /**
   * Widget definitions loaded from external files, keyed by widget ID.
   */
  widgetDefinitions?: Record<string, WidgetDefinition>
  /**
   * Optional children to render if layout doesn't specify widgets.
   */
  children?: React.ReactNode
}

/**
 * Renders a UI surface based on its declarative schema.
 * Interprets the surface layout and instantiates widgets from the registry.
 */
export function SurfaceRenderer({
  surface,
  widgetDefinitions = {},
  children,
}: SurfaceRendererProps): React.JSX.Element {
  const widgetRegistry = useService<IWidgetRegistry>(widgetRegistryToken)

  if (!surface.layout) {
    return (
      <div style={{ padding: '1rem' }}>
        <h2>No Layout Defined</h2>
        <p>Surface: {surface.id}</p>
        {children}
      </div>
    )
  }

  return renderGridLayout(
    widgetRegistry,
    surface.layout,
    widgetDefinitions,
    children,
  )
}

/**
 * Renders a grid layout with positioned widgets.
 */
function renderGridLayout(
  widgetRegistry: IWidgetRegistry,
  layout: GridLayout,
  widgetDefinitions: Record<string, WidgetDefinition>,
  children?: React.ReactNode,
): React.JSX.Element {
  const { columns, rows, widgets } = layout

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {widgets.map((widgetRef, index: number) =>
        renderGridWidget(widgetRegistry, widgetRef, widgetDefinitions, index),
      )}
      {children}
    </div>
  )
}

/**
 * Renders a single widget in a grid cell.
 */
function renderGridWidget(
  widgetRegistry: IWidgetRegistry,
  widgetRef: GridLayout['widgets'][number],
  widgetDefinitions: Record<string, WidgetDefinition>,
  index: number,
): React.JSX.Element {
  const { x, y, width, height } = widgetRef.position
  const gridStyle = {
    gridColumn: `${x + 1} / span ${width}`,
    gridRow: `${y + 1} / span ${height}`,
  }

  const widgetDef = widgetDefinitions[widgetRef.widgetId]
  if (!widgetDef) {
    return renderErrorWidget(
      index,
      gridStyle,
      `Widget not found: ${widgetRef.widgetId}`,
    )
  }

  const widgetFactory = widgetRegistry.get(widgetDef.type)
  if (!widgetFactory) {
    return renderErrorWidget(
      index,
      gridStyle,
      `Unknown widget type: ${widgetDef.type}`,
    )
  }

  return (
    <div key={index} style={gridStyle}>
      {widgetFactory(widgetDef as WidgetProps)}
    </div>
  )
}

/**
 * Renders an error widget when widget definition or factory is not found.
 */
function renderErrorWidget(
  index: number,
  gridStyle: React.CSSProperties,
  message: string,
): React.JSX.Element {
  return (
    <div
      key={index}
      style={{
        ...gridStyle,
        color: '#ff4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #ff4444',
      }}
    >
      {message}
    </div>
  )
}
