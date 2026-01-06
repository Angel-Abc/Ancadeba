// In the future we might add a more configurable text log panel here
// For now, it's just a placeholder component

import { TextLogComponent as TextLogComponentData } from '@ancadeba/schemas'

interface TextLogComponentProps {
  component: TextLogComponentData
}

export function TextLogComponent({ component }: TextLogComponentProps) {
  return (
    <div className="text-log-component">
      <h3>Text log</h3>
      <p>This is a placeholder for the text log panel. {component.type}</p>
    </div>
  )
}
