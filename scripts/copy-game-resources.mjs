import fs from 'node:fs'
import path from 'node:path'

const gameResourcesDir =
  process.env.GAME_RESOURCES_DIR ??
  path.resolve(process.cwd(), '../../game-resources')

const engineDistDir = path.resolve(process.cwd(), './dist/resources')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Game resources not found: ${src}`)
    process.exit(1)
  }

  fs.mkdirSync(dest, { recursive: true })

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

console.log(`Copying game resources:`)
console.log(`  from ${gameResourcesDir}`)
console.log(`  to   ${engineDistDir}`)

copyDir(gameResourcesDir, engineDistDir)
