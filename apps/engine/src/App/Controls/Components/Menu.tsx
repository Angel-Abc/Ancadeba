import { Action, MenuComponent as MenuComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../../../messages/core'
import {
  conditionResolverToken,
  IConditionResolver,
} from '../../../core/conditionResolver'

interface MenuComponentProps {
  component: MenuComponentData
}

export function MenuComponent({ component }: MenuComponentProps) {
  const messageBus = useService<IMessageBus>(messageBusToken)
  const conditionResolver = useService<IConditionResolver>(
    conditionResolverToken
  )

  const filteredOptions = component.options.filter((option) => {
    if (option.condition) {
      return conditionResolver.evaluateCondition(option.condition)
    } else {
      return true
    }
  })

  function onClickButton(action: Action | Action[]) {
    if (Array.isArray(action)) {
      action.forEach((act) => {
        messageBus.publish(CORE_MESSAGES.EXECUTE_ACTION, { action: act })
      })
    } else {
      messageBus.publish(CORE_MESSAGES.EXECUTE_ACTION, { action })
    }
  }

  return (
    <div className="menu-component">
      {filteredOptions.map((option) => (
        <button
          type="button"
          key={option.label}
          onClick={() => onClickButton(option.actions)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
