import { CSSCustomProperties } from '@ancadeba/ui'
import { LayoutProps } from '../../registries/types'

export const GridLayout: React.FC<LayoutProps> = ({
  layout,
}): React.JSX.Element => {
  const style: CSSCustomProperties = {
    '--ge-grid-width': layout.columns.toString(),
    '--ge-grid-height': layout.rows.toString(),
  }
  return (
    <div style={style} className="layout-grid">
      {layout.type}
    </div>
  )
}
