import { format } from 'vite-plus/fmt'
import { EditorError } from '@ancadeba/editor-core'

/** Format structured JSON before publication; text documents retain their exact source. */
export async function encodeProjectDocument(file: string, value: unknown): Promise<Buffer> {
  if (typeof value === 'string') return Buffer.from(value)
  const source = JSON.stringify(value, null, 2)

  if (source === undefined)
    throw new EditorError(422, 'invalid_project_document', `Cannot serialize ${file} as JSON`)
  const formatted = await format(file, source, { endOfLine: 'lf' })

  if (formatted.errors.length)
    throw new EditorError(422, 'invalid_project_document', `Cannot format ${file} as JSON`)

  return Buffer.from(formatted.code)
}
