import type { Widget } from '@ancadeba/content'
import type { WidgetProps } from '../../registries/types'
import { useService } from '@ancadeba/ui'
import {
  gameActionExecutorToken,
  IGameActionExecutor,
  ITranslationProvider,
  translationProviderToken,
} from '@ancadeba/engine'

type ButtonBarWidgetData = Extract<Widget, { type: 'button-bar' }>
type ButtonBarWidgetButton = ButtonBarWidgetData['buttons'][number]

export function ButtonBarWidget({
  widget,
}: WidgetProps<ButtonBarWidgetData>): React.JSX.Element {
  const translationProvider = useService<ITranslationProvider>(
    translationProviderToken,
  )
  const gameActionExecutor = useService<IGameActionExecutor>(
    gameActionExecutorToken,
  )

  const handleButtonClick = (button: ButtonBarWidgetButton): void => {
    void gameActionExecutor.execute(button.action)
  }

  return (
    <div className="button-bar-widget">
      {widget.buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          className="button-bar-widget-button"
          onClick={() => handleButtonClick(button)}
        >
          {translationProvider.getTranslation(button.label)}
        </button>
      ))}
    </div>
  )
}
