import { useEffect, useMemo, useState } from 'react'
import { BaseContentProps } from './BaseContent'
import { Panel } from '../controls/Panel'
import { ButtonBar } from '../controls/ButtonBar'
import { useService } from '@ioc/IocProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { Page } from '@loader/schema/page'
import { LabeledControlContainer } from '../controls/LabeledControlContainer'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_DATA_STORE_CHANGED } from '@editor/messages/editor'

export const PageContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
  const store = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
  const messageBus = useService<IMessageBus>(messageBusToken)

  const [page, setPage] = useState<Page | null>(store.hasData(id) ? store.retrieve<Page>(id) : null)

  // local editable fields (MVP): id + grid width/height
  const [pageId, setPageId] = useState<string>('')
  const [gridWidth, setGridWidth] = useState<number>(1)
  const [gridHeight, setGridHeight] = useState<number>(1)

  // Sync local state whenever the canonical page changes
  useEffect(() => {
    if (!page) return
    setPageId(page.id)
    // schema currently supports only grid screens
    if (page.screen.type === 'grid') {
      setGridWidth(page.screen.width)
      setGridHeight(page.screen.height)
    }
  }, [page])

  // Subscribe for async load or external updates
  useEffect(() => {
    if (store.hasData(id)) {
      setPage(store.retrieve<Page>(id))
      return
    }
    return messageBus.registerMessageListener(
      GAME_DATA_STORE_CHANGED,
      (msg) => {
        const changedId = msg.payload as number | undefined
        if (changedId === id && store.hasData(id)) {
          setPage(store.retrieve<Page>(id))
        }
      }
    )
  }, [id, store, messageBus])

  const idError = useMemo(() => (pageId.trim().length === 0 ? 'Id is required' : null), [pageId])
  const widthError = useMemo(() => (gridWidth <= 0 ? 'Width must be > 0' : null), [gridWidth])
  const heightError = useMemo(() => (gridHeight <= 0 ? 'Height must be > 0' : null), [gridHeight])
  const hasErrors = !!(idError || widthError || heightError)

  const onApply = (): void => {
    if (!page || hasErrors) return
    const updated: Page = {
      ...page,
      id: pageId.trim(),
      screen: page.screen.type === 'grid'
        ? { ...page.screen, width: gridWidth, height: gridHeight }
        : page.screen
    }
    store.update(id, updated)
  }

  const onCancel = (): void => {
    if (!page) return
    setPageId(page.id)
    if (page.screen.type === 'grid') {
      setGridWidth(page.screen.width)
      setGridHeight(page.screen.height)
    }
  }

  return (
    <>
      <Panel title={`Page: ${label}`}>
        {!page && <div>Loading page...</div>}
        {page && (
          <>
            <LabeledControlContainer label='Id'>
              <input aria-label='page-id' value={pageId} onChange={e => setPageId(e.target.value)} />
              {idError && <div className='validation-error' role='alert'>{idError}</div>}
            </LabeledControlContainer>
            {page.screen.type === 'grid' && (
              <>
                <LabeledControlContainer label='Grid width'>
                  <input
                    aria-label='grid-width'
                    type='number'
                    min={1}
                    step={1}
                    value={gridWidth}
                    onChange={e => setGridWidth(Number(e.target.value))}
                  />
                  {widthError && <div className='validation-error' role='alert'>{widthError}</div>}
                </LabeledControlContainer>
                <LabeledControlContainer label='Grid height'>
                  <input
                    aria-label='grid-height'
                    type='number'
                    min={1}
                    step={1}
                    value={gridHeight}
                    onChange={e => setGridHeight(Number(e.target.value))}
                  />
                  {heightError && <div className='validation-error' role='alert'>{heightError}</div>}
                </LabeledControlContainer>
              </>
            )}
          </>
        )}
      </Panel>
      <ButtonBar>
        <button type='button' disabled={!page || hasErrors} onClick={() => onApply()}>Apply</button>
        <button type='button' onClick={() => onCancel()}>Cancel</button>
      </ButtonBar>
    </>
  )
}

