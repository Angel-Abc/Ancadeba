// In the future we might add a more configurable appearance panel here
// For now, it's just a placeholder component

import { AppearanceComponent as AppearanceComponentData } from '@ancadeba/schemas'

interface AppearanceComponentProps {
  component: AppearanceComponentData
}

export function AppearanceComponent({ component }: AppearanceComponentProps) {
  return (
    <div className="appearance-component">
      <h3>Appearance</h3>
      <p>This is a placeholder for the appearance panel. {component.type}</p>
    </div>
  )
}
