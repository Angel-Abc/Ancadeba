import express from 'express'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from the root of the monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

const app = express()
const port = process.env.PORT || 3000
const resourcesDir = process.env.VITE_GAME_RESOURCES_DIR

console.log(`Resources Directory: ${resourcesDir}`)

app.get('/', (req, res) => {
  res.send(`Game resources are located at: ${resourcesDir}`)
})

app.listen(port, () => {
  console.log(`Editor server listening on port ${port}`)
})
