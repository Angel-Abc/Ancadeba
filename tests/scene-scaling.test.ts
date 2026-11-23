import { readFile } from 'node:fs/promises'
import { expect, it } from 'vite-plus/test'

it.each([
  'packages/ui-components/src/variables.css',
  'packages/ui-components/src/scene.css',
  'packages/ui-components/src/map.css',
  'packages/ui-components/src/game.css',
  'sample-games/market-value/theme.css',
])('keeps scene dimensions and breakpoints independent of the host page in %s', async (file) => {
  const css = await readFile(new URL('../' + file, import.meta.url), 'utf8')
  const activeRules = css.replace(/\/\*[\s\S]*?\*\//g, '')

  expect(activeRules).not.toMatch(/\d(?:px|rem|[dls]?v(?:w|h|min|max|i|b))\b/i)
})
