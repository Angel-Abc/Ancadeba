import { CSSCustomProperties } from '@app/types'
import { GridScreen } from '@loader/data/page'
import { Component } from '../component/component'
import { useService } from '@app/iocProvider'
import { conditionResolverRegistryToken, IConditionResolverRegistry } from '@registries/conditionResolverRegistry'

interface GridProps {
    screen: GridScreen
}

/**
 * Renders a grid layout of components.
 * Evaluates conditions using the condition resolver registry.
 * @param screen - Grid screen data to render.
 */
export const Grid: React.FC<GridProps> = ({ screen }): React.JSX.Element => {
    const style: CSSCustomProperties = {
        '--ge-grid-width': screen.width.toString(),
        '--ge-grid-height': screen.height.toString(),
    }
    const conditionResolverRegistry = useService<IConditionResolverRegistry>(conditionResolverRegistryToken)
    return (
        <div style={style} className='screen-grid'>
            {screen.components.map(item => {
                if (item.condition === undefined || conditionResolverRegistry.getConditionResolver(item.condition.type)?.resolve(item.condition)) {
                    const componentStyle: CSSCustomProperties = {
                        '--ge-grid-item-top': (item.position.top + 1).toString(),
                        '--ge-grid-item-left': (item.position.left + 1).toString(),
                        '--ge-grid-item-right': (item.position.right + 1).toString(),
                        '--ge-grid-item-bottom': (item.position.bottom + 1).toString(),
                    }
                    return (
                        <div className='grid-component' style={componentStyle} key={item.id.toString()}>
                            <Component component={item.component} />
                        </div>
                    )
                } else return null
            })}
        </div>
    )
}
