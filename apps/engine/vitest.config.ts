import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url))

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts']
    },
    resolve: {
        alias: {
            '@angelabc/utils': resolve(workspaceRoot, 'packages/utils/src')
        }
    }
})

