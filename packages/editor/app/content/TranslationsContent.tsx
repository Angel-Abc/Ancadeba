import { useEffect, useState } from 'react'
import { BaseContentProps } from './BaseContent'
import { Panel } from '../controls/Panel'
import { ButtonBar } from '../controls/ButtonBar'
import { useService } from '@ioc/IocProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { Language } from '@loader/schema/language'
import { AiOutlineDelete } from 'react-icons/ai'
import { ITranslationsEntriesValidator, translationsEntriesValidatorToken } from './validators/translationsEntriesValidator'
import { useService as useIocService } from '@ioc/IocProvider'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_DATA_STORE_CHANGED } from '@editor/messages/editor'

type EntryVM = { key: string; raw: string; isArray: boolean }

export const TranslationsContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
    const store = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const validator = useService<ITranslationsEntriesValidator>(translationsEntriesValidatorToken)
    const messageBus = useIocService<IMessageBus>(messageBusToken)
    const [language, setLanguage] = useState<Language | null>(store.hasData(id) ? store.retrieve<Language>(id) : null)
    const [entries, setEntries] = useState<EntryVM[]>([])
    const [newKey, setNewKey] = useState('')

    // When language becomes available or id changes, sync view model
    useEffect(() => {
        if (!language) return
        const vm: EntryVM[] = Object.keys(language.translations).sort().map(k => {
            const val = language.translations[k]
            const isArray = Array.isArray(val)
            const raw = isArray ? (val as string[]).join('\n') : String(val)
            return { key: k, raw, isArray }
        })
        setEntries(vm)
    }, [id, language])

    // Subscribe to store changes to pick up async-loaded data
    useEffect(() => {
        if (store.hasData(id)) {
            setLanguage(store.retrieve<Language>(id))
            return
        }
        return messageBus.registerMessageListener(
            GAME_DATA_STORE_CHANGED,
            (msg) => {
                const changedId = msg.payload as number | undefined
                if (changedId === id && store.hasData(id)) {
                    setLanguage(store.retrieve<Language>(id))
                }
            }
        )
    }, [id, store, messageBus])

    const validateNewKey = (keyRaw: string): string | null => {
        const key = keyRaw.trim()
        if (key.length === 0) return null
        if (!validator.isValidKey(key)) return 'Invalid key'
        if (validator.isDuplicateKey(key, entries.map(e => e.key))) return 'Key already exists'
        return null
    }
    const newKeyError = validateNewKey(newKey)

    const addEntry = (): void => {
        const k = newKey.trim()
        if (newKeyError !== null || k === '') return
        setEntries([...entries, { key: k, raw: '', isArray: false }])
        setNewKey('')
    }

    const removeEntry = (k: string): void => {
        setEntries(entries.filter(e => e.key !== k))
    }

    const updateKey = (oldKey: string, newVal: string): void => {
        const idx = entries.findIndex(e => e.key === oldKey)
        if (idx === -1) return
        const updated = entries.slice()
        updated[idx] = { ...updated[idx], key: newVal }
        setEntries(updated)
    }

    const updateRaw = (k: string, raw: string): void => {
        const idx = entries.findIndex(e => e.key === k)
        if (idx === -1) return
        const updated = entries.slice()
        updated[idx] = { ...updated[idx], raw }
        setEntries(updated)
    }

    const updateIsArray = (k: string, isArray: boolean): void => {
        const idx = entries.findIndex(e => e.key === k)
        if (idx === -1) return
        const updated = entries.slice()
        updated[idx] = { ...updated[idx], isArray }
        setEntries(updated)
    }

    const hasKeyConflicts = (): boolean => {
        const keys = entries.map(e => e.key.trim())
        const seen = new Set<string>()
        for (const k of keys) {
            if (!validator.isValidKey(k) || seen.has(k)) return true
            seen.add(k)
        }
        return false
    }

    const onApply = (): void => {
        if (hasKeyConflicts()) return
        const updated: Language = {
            id: (language?.id ?? ''),
            translations: {}
        }
        entries.forEach(e => {
            if (e.isArray) {
                const arr = e.raw.split('\n')
                updated.translations[e.key.trim()] = arr
            } else {
                updated.translations[e.key.trim()] = e.raw
            }
        })
        store.update(id, updated)
    }

    const onCancel = (): void => {
        if (!language) return
        const vm: EntryVM[] = Object.keys(language.translations).sort().map(k => {
            const val = language.translations[k]
            const isArray = Array.isArray(val)
            const raw = isArray ? (val as string[]).join('\n') : String(val)
            return { key: k, raw, isArray }
        })
        setEntries(vm)
        setNewKey('')
    }

    return (
        <>
            <Panel title={`Translations: ${label}`}>
                {!language && <div>Loading translations...</div>}
                {entries.map(e => {
                    const keyError = (!validator.isValidKey(e.key) || validator.isDuplicateKey(e.key, entries.map(x => x.key).filter(k => k !== e.key)))
                        ? 'Invalid or duplicate key' : null
                    return (
                        <div className='labeled-control' key={e.key}>
                            <label>Key</label>
                            <div className='container'>
                                <input aria-label={`key-${e.key}`} value={e.key} onChange={ev => updateKey(e.key, ev.target.value)} />
                                {keyError && <div className='validation-error' role='alert'>{keyError}</div>}
                            </div>
                            <label>List</label>
                            <div className='container'>
                                <input type='checkbox' checked={e.isArray} onChange={ev => updateIsArray(e.key, ev.target.checked)} />
                            </div>
                            <label>Value</label>
                            <div className='container'>
                                <textarea aria-label={`value-${e.key}`} rows={e.isArray ? 3 : 2} value={e.raw} onChange={ev => updateRaw(e.key, ev.target.value)} />
                                <button aria-label={`remove-${e.key}`} onClick={() => removeEntry(e.key)}><AiOutlineDelete /></button>
                            </div>
                        </div>
                    )
                })}
                <div className='add-pages'>
                    <input aria-label='new-translation-key' value={newKey} onChange={e => setNewKey(e.target.value)} />
                    <button disabled={newKeyError !== null} onClick={addEntry}>Add key</button>
                </div>
                {newKeyError && <div className='validation-error' role='alert'>{newKeyError}</div>}
            </Panel>
            <ButtonBar>
                <button type='button' disabled={hasKeyConflicts()} onClick={() => onApply()}>Apply</button>
                <button type='button' onClick={() => onCancel()}>Cancel</button>
            </ButtonBar>
        </>
    )
}
