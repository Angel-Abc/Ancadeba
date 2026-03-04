import { LayoutProps } from '../../registries/types'

export const GridLayout: React.FC<LayoutProps> = ({
  layout,
}): React.JSX.Element => {
  return <div>{layout.type}</div>
}
