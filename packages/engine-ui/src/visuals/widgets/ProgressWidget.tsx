import type { Widget } from '@ancadeba/content'
import type { WidgetProps } from '../../registries/types'

type ProgressWidgetData = Extract<Widget, { type: 'progress' }>

export function ProgressWidget({
  widget,
}: WidgetProps<ProgressWidgetData>): React.JSX.Element {
  return <div>{widget.widgetId}</div>
}
