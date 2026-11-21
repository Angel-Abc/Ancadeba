import {
  choiceFile,
  choiceFormIds,
  formFile,
  formSchema,
  type ChoiceDefinition,
  type FormDefinition,
  type GameDefinition,
} from '@ancadeba/schemas'
import { EditorError, object } from './project.js'
import type { SceneEditResult } from './sceneEditing.js'

export function editLibraryDefinition(
  documents: Record<string, unknown>,
  game: GameDefinition,
  group: 'choices' | 'forms',
  id: string,
  definition?: ChoiceDefinition | FormDefinition,
): SceneEditResult {
  const kind = group === 'choices' ? 'choice' : 'form'
  const file = group === 'choices' ? choiceFile(id) : formFile(id)
  const ids = game[group] ?? []
  const exists = ids.includes(id)
  const manifest = object(documents['game.json'])

  if (definition) {
    if (!exists && Object.hasOwn(documents, file))
      throw new EditorError(409, kind + '_exists', `A ${kind} with that ID already exists`)
    documents[file] = definition

    if (exists) return { changedFiles: [file] }
    documents['game.json'] = { ...manifest, [group]: [...ids, id] }

    return { createdFiles: [file], changedFiles: [file, 'game.json'] }
  }

  if (!exists) throw new EditorError(404, kind + '_not_found', `Unknown ${kind}: ${id}`)

  if (group === 'choices') {
    const forms = (game.forms ?? []).map((form) => formSchema.parse(documents[formFile(form)]))
    const uses = choiceFormIds(id, forms).map(formFile)

    if (game.characterProfile?.fields.includes(id)) uses.push('character profile')

    if (uses.length)
      throw new EditorError(409, 'choice_in_use', `Choice ${id} is used by ${uses.join(', ')}`)
  }

  delete documents[file]
  documents['game.json'] = { ...manifest, [group]: ids.filter((entry) => entry !== id) }

  return { removedFiles: [file], changedFiles: [file, 'game.json'] }
}
