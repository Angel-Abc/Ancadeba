export type CSSCustomProperties = React.CSSProperties & {
  [key: `--${string}`]: string
}
