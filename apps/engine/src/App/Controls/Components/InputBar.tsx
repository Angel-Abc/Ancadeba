import { InputBarComponent as InputBarComponentData } from '@ancadeba/schemas'
import { CSSCustomProperties, useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import {
  conditionResolverToken,
  IConditionResolver,
} from '../../../core/conditionResolver'
import {
  IInputConfigProvider,
  inputConfigProviderToken,
} from '../../../core/inputConfigProvider'
import {
  ILanguageProvider,
  languageProviderToken,
} from '../../../language/provider'
import { UI_MESSAGES } from '../../../messages/ui'

interface InputBarComponentProps {
  component: InputBarComponentData
}

const logName = 'engine/controls/components/InputBar'
export function InputBarComponent({ component }: InputBarComponentProps) {
  const messageBus = useService<IMessageBus>(messageBusToken)
  const languageProvider = useService<ILanguageProvider>(languageProviderToken)
  const inputConfigProvider = useService<IInputConfigProvider>(
    inputConfigProviderToken
  )
  const conditionResolver = useService<IConditionResolver>(
    conditionResolverToken
  )
  const inputRanges = inputConfigProvider.getInputRanges() ?? []
  const resolvedRules = inputConfigProvider.getResolvedInputRules()
  const maxColumns = Math.max(
    1,
    inputRanges.reduce(
      (currentMax, row) => Math.max(currentMax, row.length),
      0
    )
  )
  const maxRows = Math.max(1, inputRanges.length)
  const style: CSSCustomProperties = {
    '--ge-input-bar-columns': maxColumns.toString(),
    '--ge-input-bar-rows': maxRows.toString(),
  }
  const inputs: Array<Array<InputInfo | null>> = inputRanges.map((inputRow) => {
    const paddedRow = [...inputRow]
    for (let columnIndex = paddedRow.length; columnIndex < maxColumns; columnIndex += 1) {
      paddedRow.push(null)
    }
    return paddedRow.map((input) => {
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
  })

  console.debug(
    logName,
    'Rendering InputBarComponent with config: {0}',
    component
  )

  return (
    <div className="input-bar-component" style={style}>
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
                <div className="input-label">
                  {languageProvider.getTranslation(input.label)}
                </div>
                <div className="input-caption">
                  {languageProvider.getTranslation(input.caption)}
                </div>
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
