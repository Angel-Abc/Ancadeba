import {
  type IWidgetRegistry,
  type WidgetProps,
  ProgressBarWidget,
} from '@ancadeba/engine-ui'

/**
 * Widget definition with dataSource property.
 */
interface ProgressBarWidgetDefinition extends WidgetProps {
  dataSource: string
}

/**
 * Registers all built-in widgets with the widget registry.
 * This should be called during application initialization.
 */
export function registerWidgets(registry: IWidgetRegistry): void {
  // Register progress bar widget for boot surface
  registry.register('progress-bar', (props: WidgetProps) => {
    const progressBarProps = props as ProgressBarWidgetDefinition
    return <ProgressBarWidget dataSource={progressBarProps.dataSource} />
  })
}
