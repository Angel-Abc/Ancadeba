// In the future we might add a more configurable input bar panel here
// For now, it's just a placeholder component

import { InputBarComponent as InputBarComponentData } from '@ancadeba/schemas'

interface InputBarComponentProps {
  component: InputBarComponentData
}

export function InputBarComponent({ component }: InputBarComponentProps) {
  return (
    <div className="input-bar-component">
      <h3>Input bar</h3>
      <p>This is a placeholder for the input bar panel. {component.type}</p>
    </div>
  )
}
