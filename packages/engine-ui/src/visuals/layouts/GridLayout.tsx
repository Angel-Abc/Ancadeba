import type { Layout } from '@ancadeba/content'
import { CSSCustomProperties } from '@ancadeba/ui'
import type { LayoutProps } from '../../registries/types'
import classNames from 'classnames'
import { WidgetSlot } from '../widgets/WidgetSlot'

type GridLayoutData = Extract<Layout, { type: 'grid' }>

export const GridLayout: React.FC<LayoutProps<GridLayoutData>> = ({
  layout,
}): React.JSX.Element => {
  const style: CSSCustomProperties = {
    '--ge-grid-width': layout.columns.toString(),
    '--ge-grid-height': layout.rows.toString(),
  }
  return (
    <div style={style} className="layout-grid layout">
      {layout.widgets.map((widget) => {
        const widgetStyle: CSSCustomProperties = {
          '--ge-grid-item-x': (widget.position.column + 1).toString(),
          '--ge-grid-item-y': (widget.position.row + 1).toString(),
          '--ge-grid-item-width': widget.size.width.toString(),
          '--ge-grid-item-height': widget.size.height.toString(),
        }
        if (!widget.border) {
          widgetStyle['--ge-layout-grid-border'] = '0'
          widgetStyle['--ge-layout-grid-margin'] = '0'
        }
        return (
          <div
            key={widget.widgetId}
            style={widgetStyle}
            className={classNames(
              'grid-item',
              widget.border ? 'grid-item-bordered' : '',
            )}
          >
            <WidgetSlot widgetId={widget.widgetId} />
          </div>
        )
      })}
    </div>
  )
}
