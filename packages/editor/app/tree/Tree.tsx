import { Node } from  './Node'
import { TreeNode } from './types'

export const Tree: React.FC = (): React.JSX.Element => {
    const root: TreeNode = {
        key: 0,
        label: 'test',
        children: [],
        onClick: () => {}
    }

    return (
        <div className='tree'>
            <Node node={root} />
        </div>
    )
}
