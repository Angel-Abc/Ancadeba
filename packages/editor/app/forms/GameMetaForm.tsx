import { useCallback, useEffect, useMemo, useState } from 'react'
import { useService } from '@ioc/IocProvider'
import { IGameModel, gameModelToken } from '@editor/model/GameModel'
import { ILanguagesModel, languagesModelToken } from '@editor/model/LanguagesModel'
import { IPagesModel, pagesModelToken } from '@editor/model/PagesModel'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_META_UPDATED } from '@editor/messages/editor'

type Validation = {
  title: string | null
  version: string | null
}

const versionRegex = /^\d+\.\d+\.\d+$/

export const GameMetaForm: React.FC = (): React.JSX.Element => {
  const gameModel = useService<IGameModel>(gameModelToken)
  const languagesModel = useService<ILanguagesModel>(languagesModelToken)
  const pagesModel = useService<IPagesModel>(pagesModelToken)
  const messageBus = useService<IMessageBus>(messageBusToken)

  const initial = useMemo(() => ({
    title: gameModel.title,
    description: gameModel.description,
    version: gameModel.version,
    language: gameModel.initialLanguage,
    startPageId: gameModel.startPageId
  }), [gameModel.title, gameModel.description, gameModel.version, gameModel.initialLanguage, gameModel.startPageId])

  const [title, setTitle] = useState<string>(initial.title)
  const [description, setDescription] = useState<string>(initial.description)
  const [version, setVersion] = useState<string>(initial.version)
  const [language, setLanguage] = useState<string>(initial.language)
  const [startPageId, setStartPageId] = useState<string>(initial.startPageId)
  const [validation, setValidation] = useState<Validation>({ title: null, version: null })

  // Reset form to model values when model changes (e.g., after reload or apply)
  useEffect(() => {
    setTitle(initial.title)
    setDescription(initial.description)
    setVersion(initial.version)
    setLanguage(initial.language)
    setStartPageId(initial.startPageId)
    setValidation({ title: null, version: null })
  }, [initial.title, initial.description, initial.version, initial.language, initial.startPageId])

  const validate = useCallback((t: string, v: string): Validation => {
    const result: Validation = { title: null, version: null }
    if (!t || t.trim().length === 0) result.title = 'Title is required'
    if (!v || v.trim().length === 0) result.version = 'Version is required'
    else if (!versionRegex.test(v.trim())) result.version = 'Use format: major.minor.patch (e.g., 1.0.0)'
    return result
  }, [])

  useEffect(() => {
    setValidation(validate(title, version))
  }, [title, version, validate])

  const hasErrors = !!validation.title || !!validation.version

  const onApply = useCallback(() => {
    if (hasErrors) return
    gameModel.title = title.trim()
    gameModel.description = description
    gameModel.version = version.trim()
    gameModel.initialLanguage = language
    gameModel.startPageId = startPageId
    messageBus.postMessage({ message: GAME_META_UPDATED, payload: null })
  }, [hasErrors, gameModel, title, description, version, language, startPageId, messageBus])

  const onCancel = useCallback(() => {
    setTitle(initial.title)
    setDescription(initial.description)
    setVersion(initial.version)
    setLanguage(initial.language)
    setStartPageId(initial.startPageId)
    setValidation({ title: null, version: null })
  }, [initial.title, initial.description, initial.version, initial.language, initial.startPageId])

  return (
    <form className='form game-meta' onSubmit={(e) => { e.preventDefault(); onApply() }}>
      <h2>Game Metadata</h2>

      <fieldset className='form-section'>
        <legend>General</legend>

        <div className='form-field'>
          <label htmlFor='game-title'>Title</label>
          <input
            id='game-title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!validation.title}
            aria-describedby='game-title-error'
          />
          {validation.title && <div id='game-title-error' role='alert' className='error'>{validation.title}</div>}
        </div>

        <div className='form-field'>
          <label htmlFor='game-description'>Description</label>
          <textarea
            id='game-description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className='form-field'>
          <label htmlFor='game-version'>Version</label>
          <input
            id='game-version'
            type='text'
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder='1.0.0'
            aria-invalid={!!validation.version}
            aria-describedby='game-version-error'
          />
          {validation.version && <div id='game-version-error' role='alert' className='error'>{validation.version}</div>}
        </div>
      </fieldset>

      <fieldset className='form-section'>
        <legend>Initial Data</legend>

        <div className='form-field'>
          <label htmlFor='initial-language'>Language</label>
          <select
            id='initial-language'
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {languagesModel.languages.map(l => (
              <option key={l.language} value={l.language}>{l.language}</option>
            ))}
          </select>
        </div>

        <div className='form-field'>
          <label htmlFor='start-page'>Start Page</label>
          <select
            id='start-page'
            value={startPageId}
            onChange={(e) => setStartPageId(e.target.value)}
          >
            {pagesModel.pages.map(p => (
              <option key={p.id} value={p.id}>{p.id}</option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className='form-actions'>
        <button type='submit' disabled={hasErrors}>Apply</button>
        <button type='button' onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
