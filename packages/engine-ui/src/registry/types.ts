import type React from 'react'

/**
 * Data that can be passed to widget components through data source bindings.
 */
export type WidgetData = Record<string, unknown>

/**
 * Props that all widgets receive from the renderer.
 */
export interface WidgetProps {
  /**
   * Data bound from the data source context.
   */
  data?: WidgetData
}

/**
 * Factory function that creates a React component for a given widget type.
 */
export type WidgetFactory = (props: WidgetProps) => React.JSX.Element

/**
 * Service that maps widget type strings to React component factories.
 * Enables data-driven UI surface rendering by allowing dynamic widget instantiation.
 */
export interface IWidgetRegistry {
  /**
   * Register a widget component factory for a given type string.
   * @param type - The widget type identifier (e.g., 'progress-bar', 'world-view')
   * @param factory - The React component factory function
   */
  register(type: string, factory: WidgetFactory): void

  /**
   * Retrieve a widget factory by type string.
   * @param type - The widget type identifier
   * @returns The widget factory, or undefined if not registered
   */
  get(type: string): WidgetFactory | undefined

  /**
   * Check if a widget type is registered.
   * @param type - The widget type identifier
   * @returns True if the widget type is registered
   */
  has(type: string): boolean

  /**
   * Get all registered widget type identifiers.
   * @returns Array of registered widget type strings
   */
  getTypes(): string[]
}

export const WidgetRegistryLogName = 'engine-ui/registry/WidgetRegistry'
