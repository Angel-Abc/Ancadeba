import type { RuleFormControls } from './ruleFormControls.js'

/** Offer the same exact-key navigation from specialist controls that already show a key and preview. */
export function linkedTranslationFields(
  controls: RuleFormControls,
  openKey?: (key: string) => void,
): RuleFormControls {
  if (!openKey) return controls

  return {
    ...controls,
    translation(...args) {
      const field = controls.translation(...args)
      const input = field.querySelector('input')!

      const link = controls.button(controls.t('inspector.editTranslation'), () =>
        openKey(input.value),
      )

      link.setAttribute('aria-label', controls.t('inspector.editField', { field: args[0] }))

      const update = () => {
        link.hidden = !input.value
        link.setAttribute('data-inspector-link', 'translation/' + input.value + '/' + args[0])
      }

      const box = controls.create('div')
      box.className = 'specialist-key-field'
      box.append(field, link)
      input.addEventListener('input', update)
      update()

      return box
    },
  }
}

/** Pairs a scene's literal field with its adjacent catalog-key control while keeping one draft. */
export function inspectorTranslations(controls: RuleFormControls, openKey?: (key: string) => void) {
  const translations = new WeakMap<HTMLElement, { title: string; texts: Map<string, string> }>()

  const labels = new WeakMap<HTMLElement, string>()
  const { t, create } = controls

  const decorated: RuleFormControls = {
    ...controls,
    input(...args) {
      const field = controls.input(...args)
      labels.set(field, args[0])

      return field
    },
    translation(...args) {
      const field = controls.translation(...args)
      const texts = new Map(args[2])
      translations.set(field, { title: args[0], texts })
      const input = field.querySelector('input')!

      const validate = () =>
        input.setCustomValidity(input.value && !texts.has(input.value) ? t('form.unknownKey') : '')

      validate()
      input.addEventListener('input', () => {
        validate()

        if (!texts.has(input.value)) {
          controls.markEdited()
          args[3](input.value)
        }
      })

      return field
    },
  }

  const arrange = (parent: HTMLElement) => {
    // SAFETY: Inspector form builders create HTML controls exclusively.
    const children = Array.from(parent.children) as HTMLElement[]

    if (!children.length) return
    const result: HTMLElement[] = []
    let changed = false

    for (const child of children) {
      const data = translations.get(child)

      if (!data) {
        if (
          child.className !== 'inspector-localized' &&
          ['fieldset', 'div', 'details', 'form'].includes(child.tagName.toLowerCase())
        )
          arrange(child)
        result.push(child)
        continue
      }

      const previous = result.at(-1)

      const literal =
        previous?.tagName.toLowerCase() === 'label' &&
        (labels.has(previous) || previous.querySelector('textarea'))
          ? result.pop()
          : undefined

      const input = child.querySelector('input')!
      const caption = create('span')
      const value = create('p')
      value.className = 'inspector-translated-value'
      caption.textContent = literal ? (labels.get(literal) ?? literal.textContent) : data.title
      const edit = controls.button(t('inspector.editTranslation'), () => openKey?.(input.value))
      edit.setAttribute(
        'aria-label',
        t('inspector.editField', { field: caption.textContent ?? data.title }),
      )
      const box = create('div')
      box.className = 'inspector-localized'
      box.setAttribute('role', 'group')
      box.setAttribute('aria-label', caption.textContent ?? data.title)
      const fallback = create('div')

      const fold = controls.fold(
        'translation-' + data.title,
        t(literal ? 'inspector.translation' : 'form.translationKey'),
        false,
        child,
        fallback,
      )

      const show = () => {
        const key = input.value
        edit.setAttribute('data-inspector-link', 'translation/' + key + '/' + data.title)
        const keyed = Boolean(key)
        caption.hidden = !keyed
        value.hidden = !keyed
        value.textContent = keyed
          ? data.texts.get(key) ||
            t(data.texts.has(key) ? 'metadata.emptyTranslation' : 'form.unknownKey')
          : ''
        edit.hidden = !keyed || !openKey

        if (literal) {
          if (keyed) fallback.replaceChildren(literal)
          else direct.replaceChildren(literal)
        }

        if (keyed && !data.texts.has(key)) fold.open = true
      }

      const direct = create('div')
      box.append(caption, edit, value, direct, fold)
      input.addEventListener('input', show)
      show()
      result.push(box)
      changed = true
    }

    if (changed) parent.replaceChildren(...result)
  }

  return { controls: decorated, arrange }
}
