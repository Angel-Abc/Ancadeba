import { GameMenuComponent } from '@loader/data/component'
import { Button } from '@loader/data/button'
import { ITranslationService, translationServiceToken } from '@services/translationService'
import { useService } from '@ioc/IocProvider'
import { actionExecutorToken, IActionExecutor } from '@actions/actionExecutor'

interface GameMenuProps {
    component: GameMenuComponent
}

/**
 * Renders a game menu with buttons.
 * Executes each button's action when clicked.
 * @param component - Game menu definition.
 */
export const GameMenu: React.FC<GameMenuProps> = ({ component }): React.JSX.Element => {
    const translationService = useService<ITranslationService>(translationServiceToken)
    const actionExecutor = useService<IActionExecutor>(actionExecutorToken)

    const onButtonClick = (button: Button) => {
        actionExecutor.execute(button.action)
    }

    return (
        <div className='game-menu'>
            {component.buttons.map(button => (
                <button type='button' key={button.id.toString()} onClick={() => onButtonClick(button)}>
                    {translationService.translate(button.label)}
                </button>
            ))}
        </div>
    )
}
