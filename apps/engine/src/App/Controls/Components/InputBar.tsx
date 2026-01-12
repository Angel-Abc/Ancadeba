import { InputBarComponent as InputBarComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import {
  conditionResolverToken,
  IConditionResolver,
} from '../../../core/conditionResolver'
import {
  IInputConfigProvider,
  inputConfigProviderToken,
} from '../../../core/inputConfigProvider'
import { UI_MESSAGES } from '../../../messages/ui'

interface InputBarComponentProps {
  component: InputBarComponentData
}

const logName = 'engine/controls/components/InputBar'
export function InputBarComponent({ component }: InputBarComponentProps) {
  const messageBus = useService<IMessageBus>(messageBusToken)
  const inputConfigProvider = useService<IInputConfigProvider>(
    inputConfigProviderToken
  )
  const conditionResolver = useService<IConditionResolver>(
    conditionResolverToken
  )
  const inputRanges = inputConfigProvider.getInputRanges() ?? []
  const resolvedRules = inputConfigProvider.getResolvedInputRules()
  const inputs: Array<Array<InputInfo | null>> = inputRanges.map((inputRow) =>
    inputRow.map((input) => {
      if (!input) {
        return null
      }
      const rule = resolvedRules.get(input.virtualInput)
      const visible = rule
        ? rule.visible
          ? conditionResolver.evaluateCondition(rule.visible)
          : true
        : false
      const enabled = rule
        ? rule.enabled
          ? conditionResolver.evaluateCondition(rule.enabled)
          : true
        : false
      const caption = rule?.caption ?? input.label

      return {
        virtualInput: input.virtualInput,
        label: input.label,
        caption,
        enabled,
        visible,
      }
    })
  )

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
          if (!input || !input.visible) {
            return <div key={key} className="input-cell" />
          }
          return (
            <div key={key} className="input-cell">
              <button
                disabled={!input.enabled}
                onClick={() => {
                  if (!input.enabled) {
                    return
                  }
                  messageBus.publish(UI_MESSAGES.VIRTUAL_INPUT_PRESSED, {
                    virtualInput: input.virtualInput,
                    label: input.label,
                  })
                }}
              >
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
  virtualInput: string
  label: string
  caption: string
  enabled: boolean
  visible: boolean
}
