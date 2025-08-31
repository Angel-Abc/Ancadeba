import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { BaseContentProps } from './BaseContent'
import { Panel } from '../controls/Panel'
import { ButtonBar } from '../controls/ButtonBar'
import { useService } from '@ioc/IocProvider'
import { gameDataStoreProviderToken, IGameDataStoreProvider } from '@editor/providers/gameDataStoreProvider'
import { Page } from '@loader/schema/page'
import { LabeledControlContainer } from '../controls/LabeledControlContainer'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { GAME_DATA_STORE_CHANGED } from '@editor/messages/editor'

const formSchema = z.object({
  pageId: z.string().trim().min(1, 'Id is required'),
  gridWidth: z.coerce.number().int().positive('Width must be > 0'),
  gridHeight: z.coerce.number().int().positive('Height must be > 0')
})

type FormModel = z.infer<typeof formSchema>

export const PageContent: React.FC<BaseContentProps> = ({ id, label }): React.JSX.Element => {
  const store = useService<IGameDataStoreProvider>(gameDataStoreProviderToken)
  const messageBus = useService<IMessageBus>(messageBusToken)

  const [page, setPage] = useState<Page | null>(store.hasData(id) ? store.retrieve<Page>(id) : null)

  const { register, handleSubmit, formState, reset } = useForm<FormModel>({
    resolver: zodResolver(formSchema),
    defaultValues: { pageId: '', gridWidth: 12, gridHeight: 8 },
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  // Sync form with canonical data
  useEffect(() => {
    if (!page) return
    const defaults: FormModel = {
      pageId: page.id,
      gridWidth: page.screen.type === 'grid' ? page.screen.width : 12,
      gridHeight: page.screen.type === 'grid' ? page.screen.height : 8
    }
    reset(defaults, { keepDirty: false })
  }, [page, reset])

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

  const onApply = handleSubmit((model) => {
    if (!page) return
    const updated: Page = {
      ...page,
      id: model.pageId.trim(),
      screen: page.screen.type === 'grid'
        ? { ...page.screen, width: model.gridWidth, height: model.gridHeight }
        : page.screen
    }
    store.update(id, updated)
  })

  const onCancel = (): void => {
    if (!page) return
    const defaults: FormModel = {
      pageId: page.id,
      gridWidth: page.screen.type === 'grid' ? page.screen.width : 12,
      gridHeight: page.screen.type === 'grid' ? page.screen.height : 8
    }
    reset(defaults, { keepDirty: false })
  }

  return (
    <>
      <Panel title={`Page: ${label}`}>
        {!page && <div>Loading page...</div>}
        {page && (
          <>
            <LabeledControlContainer label='Id'>
              <input aria-label='page-id' {...register('pageId')} />
              {formState.errors.pageId && <div className='validation-error' role='alert'>{formState.errors.pageId.message}</div>}
            </LabeledControlContainer>
            {page.screen.type === 'grid' && (
              <>
                <LabeledControlContainer label='Grid width'>
                  <input aria-label='grid-width' type='number' min={1} step={1} {...register('gridWidth', { valueAsNumber: true })} />
                  {formState.errors.gridWidth && <div className='validation-error' role='alert'>{formState.errors.gridWidth.message}</div>}
                </LabeledControlContainer>
                <LabeledControlContainer label='Grid height'>
                  <input aria-label='grid-height' type='number' min={1} step={1} {...register('gridHeight', { valueAsNumber: true })} />
                  {formState.errors.gridHeight && <div className='validation-error' role='alert'>{formState.errors.gridHeight.message}</div>}
                </LabeledControlContainer>
              </>
            )}
          </>
        )}
      </Panel>
      <ButtonBar>
        <button type='button' disabled={!page || !formState.isDirty || !formState.isValid} onClick={() => onApply()}>Apply</button>
        <button type='button' onClick={() => onCancel()}>Cancel</button>
      </ButtonBar>
    </>
  )
}
