import {
  GridScreen as GridScreenData,
  Component as ComponentData,
} from '@ancadeba/schemas'
import { CSSCustomProperties } from '@ancadeba/ui'
import { Component } from './Component'

interface GridScreenProps {
  screen: GridScreenData
  components: ComponentData[]
}

export function GridScreen({ screen, components }: GridScreenProps) {
  const style: CSSCustomProperties = {
    '--ge-grid-width': screen.grid.columns.toString(),
    '--ge-grid-height': screen.grid.rows.toString(),
  }
  return (
    <div style={style} className="grid-screen">
      {components.map((component, index) => {
        const componentStyle: CSSCustomProperties = {
          '--ge-grid-item-x': (component.location.x + 1).toString(),
          '--ge-grid-item-y': (component.location.y + 1).toString(),
          '--ge-grid-item-width': component.size.width.toString(),
          '--ge-grid-item-height': component.size.height.toString(),
        }
        const key = `component-${component.type}-${index}`
        return (
          <div key={key} style={componentStyle}>
            <Component component={component} />
          </div>
        )
      })}
    </div>
  )
}
