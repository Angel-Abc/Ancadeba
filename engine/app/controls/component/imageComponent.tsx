import { CSSCustomProperties } from '@app/types'
import { ImageComponent as ImageComponentData } from '@loader/data/component'

interface ImageComponentProps {
    component: ImageComponentData
}

export const ImageComponent: React.FC<ImageComponentProps> = ({ component }): React.JSX.Element => {
    const style: CSSCustomProperties = {
        '--ge-image-path': `url("${component.image}")`,
    }
    return (
        <div style={style} className='image-component' />
    )
}
