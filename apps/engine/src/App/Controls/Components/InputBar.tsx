// In the future we might add a more configurable input bar panel here
// For now, it's just a placeholder component

import { InputBarComponent as InputBarComponentData } from '@ancadeba/schemas'

interface InputBarComponentProps {
  component: InputBarComponentData
}

const logName = 'engine/controls/components/InputBar'
export function InputBarComponent({ component }: InputBarComponentProps) {
  // TODO: Query an input service to get the current inputs, using the component row and column counts
  const inputs = dummyInputs

  console.debug(
    logName,
    'Rendering InputBarComponent with config: {0}',
    component
  )

  return (
    <div className="input-bar-component">
      {inputs.flatMap((inputRow, rowIndex) =>
        inputRow.map((input, inputIndex) => {
          const key = `${rowIndex}-${inputIndex}`
          if (input.virtualKey === '') {
            return <div key={key} className="input-cell" />
          }
          return (
            <div key={key} className="input-cell">
              <button disabled={!input.enabled}>
                <div className="input-label">{input.label}</div>
                <div className="input-caption">{input.caption}</div>
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}

interface InputInfo {
  virtualKey: string
  label: string
  caption: string
  enabled?: boolean
}

const nullInput: InputInfo = {
  virtualKey: '',
  label: '',
  caption: '',
}

const dummyInputs: InputInfo[][] = [
  [nullInput, nullInput, nullInput, nullInput, nullInput, nullInput],
  [
    nullInput,
    {
      virtualKey: 'VI_UP',
      label: 'W',
      caption: 'Move Up',
      enabled: true,
    },
    nullInput,
    nullInput,
    nullInput,
    nullInput,
  ],
  [
    {
      virtualKey: 'VI_LEFT',
      label: 'A',
      caption: 'Move Left',
      enabled: true,
    },
    {
      virtualKey: 'VI_DOWN',
      label: 'S',
      caption: 'Move Down',
      enabled: true,
    },
    {
      virtualKey: 'VI_RIGHT',
      label: 'D',
      caption: 'Move Right',
      enabled: false,
    },
    nullInput,
    nullInput,
    nullInput,
  ],
  [nullInput, nullInput, nullInput, nullInput, nullInput, nullInput],
]
