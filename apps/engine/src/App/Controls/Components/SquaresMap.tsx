import { SquaresMapComponent as SquaresMapComponentData } from '@ancadeba/schemas'

interface SquaresMapComponentProps {
  component: SquaresMapComponentData
}

export function SquaresMapComponent({ component }: SquaresMapComponentProps) {
  return <div>TODO {component.type}</div>
}
