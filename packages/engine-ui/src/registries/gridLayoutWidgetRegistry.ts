export interface GridLayoutWidgetProps {
  widgetId: string
}

export type GridLayoutWidgetComponent =
  React.ComponentType<GridLayoutWidgetProps>

type GridLayoutWidgetRegistry = Record<string, GridLayoutWidgetComponent>
const registry: GridLayoutWidgetRegistry = {}

export function registerGridLayoutWidget(
  id: string,
  component: GridLayoutWidgetComponent,
): void {
  registry[id] = component
}

export function getGridLayoutWidget(
  id: string,
): GridLayoutWidgetComponent | undefined {
  return registry[id]
}
