import { MenuComponent as MenuComponentData } from '@ancadeba/schemas'

interface MenuComponentProps {
  component: MenuComponentData
}

export function MenuComponent({ component }: MenuComponentProps) {
  return <div>Menu Component {component.type}</div>
}
