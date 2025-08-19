/**
 * Extends React.CSSProperties to include support for CSS custom properties.
 * Allows defining style attributes with `--` prefixes to set CSS variables.
 */
export type CSSCustomProperties = React.CSSProperties & {
  [key: `--${string}`]: string
}
