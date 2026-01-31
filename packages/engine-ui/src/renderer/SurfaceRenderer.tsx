import type React from 'react'
import { useService } from '@ancadeba/ui'
import type { Surface } from '@ancadeba/content'
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
   * Optional children to render if layout doesn't specify widgets.
   */
  children?: React.ReactNode
}

/**
 * Layout definition shape (subset of what's in the Surface schema).
 */
interface LayoutDefinition {
  type?: string
  widgets?: WidgetDefinition[]
  [key: string]: unknown
}

/**
 * Widget definition from surface layout schema.
 */
interface WidgetDefinition {
  type: string
  [key: string]: unknown
}

/**
 * Renders a UI surface based on its declarative schema.
 * Interprets the surface layout and instantiates widgets from the registry.
 */
export function SurfaceRenderer({
  surface,
  children,
}: SurfaceRendererProps): React.JSX.Element {
  const widgetRegistry = useService<IWidgetRegistry>(widgetRegistryToken)

  // Cast layout to expected shape
  const layout = surface.layout as LayoutDefinition | undefined

  // Handle centered layout type
  if (layout?.type === 'centered') {
    return renderCenteredLayout(widgetRegistry, layout, children)
  }

  // Handle game-layout type (for gameplay surfaces)
  if (layout?.type === 'game-layout') {
    return renderGameLayout(surface, children)
  }

  // Fallback for unknown layout types
  return renderUnknownLayout(surface, layout, children)
}

/**
 * Renders a centered layout with widgets.
 */
function renderCenteredLayout(
  widgetRegistry: IWidgetRegistry,
  layout: LayoutDefinition,
  children?: React.ReactNode,
): React.JSX.Element {
  const widgets = layout.widgets ?? []

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {widgets.map((widgetDef: WidgetDefinition, index: number) => {
        const widgetFactory = widgetRegistry.get(widgetDef.type)

        if (!widgetFactory) {
          return (
            <div key={index} style={{ color: '#ff4444' }}>
              Unknown widget: {widgetDef.type}
            </div>
          )
        }

        // Pass the widget definition as props
        // The widget can extract what it needs (e.g., dataSource)
        return <div key={index}>{widgetFactory(widgetDef as WidgetProps)}</div>
      })}
      {children}
    </div>
  )
}

/**
 * Renders a game layout (placeholder for future implementation).
 */
function renderGameLayout(
  surface: Surface,
  children?: React.ReactNode,
): React.JSX.Element {
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Game Layout (Not Yet Implemented)</h2>
      <p>Surface: {surface.id}</p>
      {children}
    </div>
  )
}

/**
 * Renders an unknown layout type fallback.
 */
function renderUnknownLayout(
  surface: Surface,
  layout: LayoutDefinition | undefined,
  children?: React.ReactNode,
): React.JSX.Element {
  return (
    <div style={{ padding: '1rem' }}>
      <h2>Unknown Layout Type: {layout?.type ?? 'none'}</h2>
      <p>Surface: {surface.id}</p>
      {children}
    </div>
  )
}
