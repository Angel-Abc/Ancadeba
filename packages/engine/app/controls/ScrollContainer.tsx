import { useRef, useLayoutEffect, type ReactNode } from 'react'

type ScrollContainerProps = {
  children?: ReactNode
  className?: string
  html?: string
}

export const ScrollContainer: React.FC<ScrollContainerProps> = ({ children, className, html }): React.JSX.Element => {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight * 1.1

    if (isAtBottom) {
      el.scrollTop = el.scrollHeight
    }

  }, [children, html]) 

  if (html) {
    return (
      <div
        ref={ref}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={className}
    >
      {children}
    </div>
  )
}
