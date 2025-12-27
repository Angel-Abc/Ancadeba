import { Action, MenuComponent as MenuComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../../../messages/core'

interface MenuComponentProps {
  component: MenuComponentData
}

export function MenuComponent({ component }: MenuComponentProps) {
  const messageBus = useService<IMessageBus>(messageBusToken)

  function onClickButton(action: Action) {
    messageBus.publish(CORE_MESSAGES.EXECUTE_ACTION, { action })
  }

  return (
    <div className="menu-component">
      {component.options.map((option) => (
        <button
          type="button"
          key={option.label}
          onClick={() => onClickButton(option.action)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
