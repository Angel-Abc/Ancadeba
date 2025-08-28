import { BaseContentProps } from './BaseContent'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { useService } from '@ioc/IocProvider'
import { Game } from '@loader/schema/game'
import { useState } from 'react'
import { Panel } from '../controls/Panel'
import { LabeledControlContainer } from '../controls/LabeledControlContainer'
import { ButtonBar } from '../controls/ButtonBar'
import { IRootValidator, rootValidatorToken } from './validators/rootValidator'

export const RootContent: React.FC<BaseContentProps> = ({ id }): React.JSX.Element => {
    const gameDataStoreProvider = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
    const game = gameDataStoreProvider.retrieve<Game>(id)
    const validator = useService<IRootValidator>(rootValidatorToken)
    const [title, setTitle] = useState<string>(game.title)
    const [description, setDescription] = useState<string>(game.description)
    const [version, setVersion] = useState<string>(game.version)
    const [initialLanguage, setInitialLanguage] = useState<string>(game['initial-data'].language)
    const [startPage, setStartPage] = useState<string>(game['initial-data']['start-page'])

    const languages = Object.keys(game.languages).sort()
    const pages = Object.keys(game.pages).sort()

    const onCancel = (): void => {
        setTitle(game.title)
        setDescription(game.description)
        setVersion(game.version)
        setInitialLanguage(game['initial-data'].language)
        setStartPage(game['initial-data']['start-page'])
    }

    const onApply = (): void => {
        if (validator.validateTitle(title) && validator.validateDescription(description) && validator.validateVersion(version)) {
            game.title = title
            game.description = description
            game.version = version
            game['initial-data'].language = initialLanguage
            game['initial-data']['start-page'] = startPage
            gameDataStoreProvider.update(id, game)
        }
    }

    return (
        <>
            <Panel title='Properties'>
                <LabeledControlContainer label='Title'>
                    <input
                        type='text'
                        id='title'
                        required
                        value={title}
                        autoComplete='false'
                        onChange={e => setTitle(e.target.value)}
                    />
                </LabeledControlContainer>
                <LabeledControlContainer label='Description'>
                    <textarea
                        id='description'
                        value={description}
                        autoComplete='false'
                        onChange={e => setDescription(e.target.value)}
                        rows={5}
                    />
                </LabeledControlContainer>
                <LabeledControlContainer label='Version'>
                    <input
                        type='text'
                        id='version'
                        required
                        value={version}
                        autoComplete='false'
                        onChange={e => setVersion(e.target.value)}
                    />
                </LabeledControlContainer>
            </Panel>
            <Panel title='Initial data'>
                <LabeledControlContainer label='Language'>
                    <select onChange={e => setInitialLanguage(e.target.value)} value={initialLanguage}>
                        <option value=''>Please select a language</option>
                        {languages.map(language => (
                            <option key={language}>{language}</option>
                        ))}
                    </select>
                </LabeledControlContainer>
                <LabeledControlContainer label='StartPage'>
                    <select onChange={e => setStartPage(e.target.value)} value={startPage}>
                        <option value=''>Please select a page</option>
                        {pages.map(page => (
                            <option key={page}>{page}</option>
                        ))}
                    </select>
                </LabeledControlContainer>
            </Panel>
            <ButtonBar>
                <button type='button' onClick={() => onApply()}>Apply</button>
                <button type='button' onClick={() => onCancel()}>Cancel</button>
            </ButtonBar>
        </>
    )
}
