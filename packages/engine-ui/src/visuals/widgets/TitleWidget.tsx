import type { Widget } from '@ancadeba/content'
import type { WidgetProps } from '../../registries/types'
import { CSSCustomProperties, useService } from '@ancadeba/ui'
import {
  ITranslationProvider,
  translationProviderToken,
} from '@ancadeba/engine'

type TitleWidgetData = Extract<Widget, { type: 'title' }>

export function TitleWidget({
  widget,
}: WidgetProps<TitleWidgetData>): React.JSX.Element {
  const translationProvider = useService<ITranslationProvider>(
    translationProviderToken,
  )
  const title = translationProvider.getTranslation(widget.title)
  const style: CSSCustomProperties = {
    '--ge-widget-title-font-size': widget['font-size'].toString(),
  }

  return (
    <div className="title-widget" style={style}>
      {title}
    </div>
  )
}
