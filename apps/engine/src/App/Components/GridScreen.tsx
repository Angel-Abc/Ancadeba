import { GridScreen as GridScreenData } from '@ancadeba/schemas'
import { CSSCustomProperties } from '@ancadeba/ui'

interface GridScreenProps {
  screen: GridScreenData
}

export function GridScreen({ screen }: GridScreenProps) {
  const style: CSSCustomProperties = {
    '--ge-grid-width': screen.grid.columns.toString(),
    '--ge-grid-height': screen.grid.rows.toString(),
  }
  return <div style={style}>GridScreen</div>
}
