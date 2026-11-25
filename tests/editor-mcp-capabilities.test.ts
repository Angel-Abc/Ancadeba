import { describe, expect, it } from 'vite-plus/test'
import { capabilities } from '@ancadeba/editor-core'
import { EditorApiClient } from '../apps/editor-mcp/src/editorApiClient.js'

describe('MCP folder rename capability', () => {
  it('allows title-only rename and rejects folder rename before posting when unsupported', async () => {
    const requests: string[] = []

    const client = new EditorApiClient(
      { editorServerUrl: 'http://127.0.0.1:3100', game: 'game', timeoutMs: 1000 },
      async (url, init) => {
        const address = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url

        if (address.endsWith('capabilities'))
          return Response.json({
            ...capabilities,
            features: {
              ...capabilities.features,
              projectRenaming: true,
              projectFolderRenaming: false,
            },
          })

        if (init?.method === 'POST' && typeof init.body === 'string') requests.push(init.body)

        return Response.json({
          revision: 'two',
          game: null,
          scenes: [],
          diagnostics: [],
          path: 'game',
          previousPath: 'game',
        })
      },
    )

    await client.renameProject({ expectedRevision: 'one', title: 'Renamed' })
    expect(requests).toHaveLength(1)
    await expect(
      client.renameProject({ expectedRevision: 'two', folderName: 'other', title: 'Changed' }),
    ).rejects.toMatchObject({ code: 'unsupported_project_management' })
    expect(requests).toHaveLength(1)
  })
})
