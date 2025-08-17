import { CSSCustomProperties } from '@app/types'
import { ImageComponent } from '@loader/data/component'

interface ImageProps {
    component: ImageComponent
}

/**
 * Displays an image using CSS custom properties.
 * @param component - Image component definition.
 */
export const Image: React.FC<ImageProps> = ({ component }): React.JSX.Element => {
    const style: CSSCustomProperties = {
        '--ge-image-path': `url("${component.image}")`,
    }
    return (
        <div style={style} className='image-component' />
    )
}
