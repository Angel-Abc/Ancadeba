// In the future we might add a more configurable character sheet panel here
// For now, it's just a placeholder component

import { CharacterSheetComponent as CharacterSheetComponentData } from '@ancadeba/schemas'

interface CharacterSheetComponentProps {
  component: CharacterSheetComponentData
}

export function CharacterSheetComponent({
  component,
}: CharacterSheetComponentProps) {
  return (
    <div className="character-sheet-component">
      <h3>Character sheet</h3>
      <p>
        This is a placeholder for the character sheet panel. {component.type}
      </p>
    </div>
  )
}
