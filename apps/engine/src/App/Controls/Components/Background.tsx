import { BackgroundComponent as BackgroundComponentData } from '@ancadeba/schemas'
import { CSSCustomProperties, useService } from '@ancadeba/ui'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../../resourceData/provider'

interface BackgroundComponentProps {
  component: BackgroundComponentData
}

export function BackgroundComponent({ component }: BackgroundComponentProps) {
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const imageUrl = `url('${resourceDataProvider.assetsUrl}${component.image}')`
  const style: CSSCustomProperties = {
    '--ge-background-color': component.color,
    '--ge-background-image': imageUrl,
  }
  return <div style={style} className="background-component" />
}
