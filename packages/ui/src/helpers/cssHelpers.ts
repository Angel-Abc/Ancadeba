import { CSSProperties } from 'react'

export type CSSCustomProperties = CSSProperties & {
  [key: `--${string}`]: string
}
