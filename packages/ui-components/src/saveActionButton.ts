import { maxGameSaveBytes, type ButtonComponentData } from '@ancadeba/game-runtime'
import type { ComponentRenderContext, RenderedComponent } from './componentRendering.js'
import { BrowserGameSaveDownload } from './browserGameSaveDownload.js'
import { componentRuntimeText } from './runtimeText.js'

/** Portable-file actions own their native file input and cancel stale asynchronous reads. */
export function renderSaveActionButton(
  component: ButtonComponentData,
  context: ComponentRenderContext,
): RenderedComponent {
  const { document, saves } = context
  const action = component.action!.type
  const element = document.createElement('button')
  element.type = 'button'
  element.className = 'ancadeba-button'
  element.textContent = component.label
  const file = document.createElement('input')
  file.type = 'file'
  file.accept = '.json,application/json'
  file.hidden = true
  const root = action === 'import-save' ? document.createElement('div') : element

  if (root !== element) {
    root.className = 'ancadeba-save-import'
    root.append(element, file)
  }

  const download = new BrowserGameSaveDownload(document)
  const t = componentRuntimeText(context)
  let disposed = false
  let reading = false
  let epoch = 0
  let selectedSlot = saves?.selectedSlot
  let releaseRead: (() => void) | undefined
  let cancelConfirmation: (() => void) | undefined

  const update = () => {
    if (selectedSlot !== saves?.selectedSlot) {
      selectedSlot = saves?.selectedSlot
      epoch++
      cancelConfirmation?.()
    }

    const allowed =
      action === 'save-game'
        ? saves?.canSave
        : action === 'load-autosave'
          ? saves?.canLoadAutosave
          : action === 'delete-save'
            ? saves?.canDelete
            : action === 'import-save'
              ? saves?.canImport
              : saves?.canLoad

    element.disabled = reading || !allowed
  }

  const onClick = (event: Event) => {
    if (event.target === file) return
    update()

    if (disposed || element.disabled || !saves) return

    if (action === 'save-game') saves.save()
    else if (action === 'load-game') {
      if (context.onLoadGame) context.onLoadGame()
      else saves.load()
    } else if (action === 'load-autosave') {
      if (context.onLoadAutosave) context.onLoadAutosave()
      else saves.loadAutosave()
    } else if (action === 'delete-save') {
      const selected = saves.slots.find(({ id }) => id === saves.selectedSlot)
      const selection = epoch
      const slot = saves.selectedSlot
      cancelConfirmation = context.confirm?.(
        () => t('save.confirmDelete', { slot, name: selected?.name || t('save.unnamed') }),
        () => {
          if (!disposed && selection === epoch && saves.canDelete) saves.delete()
        },
      )
    } else if (action === 'import-save') {
      file.value = ''
      file.click()
    } else {
      const snapshot = saves.exportFile()

      if (snapshot)
        try {
          if (context.downloadSave) context.downloadSave(snapshot)
          else download.download(snapshot)
        } catch {
          saves.reportError?.('downloadError')
        }
    }
  }

  const onFile = async () => {
    const selected = file.files?.[0]

    if (!selected || reading || disposed || !saves?.canImport) return

    if (selected.size > maxGameSaveBytes) {
      saves.reportError?.('too-large')

      return
    }

    const selection = epoch
    reading = true
    releaseRead = saves.beginFileRead?.()
    update()

    try {
      const text = await selected.text()

      if (disposed || selection !== epoch) return
      releaseRead?.()
      releaseRead = undefined

      const perform = () => {
        if (!disposed && selection === epoch && saves.canImport) saves.importFile(text)
      }

      if (saves.slots.find(({ id }) => id === saves.selectedSlot)?.occupied)
        cancelConfirmation = context.confirm?.(() => t('save.confirmImport'), perform)
      else perform()
    } catch {
      releaseRead?.()

      if (!disposed && selection === epoch) saves.reportError?.('fileError')
    } finally {
      releaseRead?.()
      releaseRead = undefined
      reading = false
      file.value = ''

      if (!disposed) update()
    }
  }

  element.addEventListener('click', onClick)
  file.addEventListener('change', onFile)
  const unsubscribe = saves?.subscribe(update)
  update()

  return {
    element: root,
    dispose() {
      disposed = true
      cancelConfirmation?.()
      releaseRead?.()
      unsubscribe?.()
      element.removeEventListener('click', onClick)
      file.removeEventListener('change', onFile)
      download.dispose()
      root.remove()
    },
  }
}
