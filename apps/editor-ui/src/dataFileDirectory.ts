import type { Translate } from '@ancadeba/utilities'
import type { ProjectSectionParticipant } from './projectSectionRegistry.js'
import { dataFilesSection, type ProjectTreeNode } from './projectTree.js'

export function dataFileDirectory(
  root: HTMLElement,
  t: Translate,
  visit: (key: string) => boolean,
): ProjectSectionParticipant {
  const document = root.ownerDocument
  const label = document.createElement('label')
  const caption = document.createElement('span')
  const search = document.createElement('input')
  search.type = 'search'
  label.append(caption, search)
  const results = document.createElement('div')
  root.replaceChildren(label, results)
  const queries = new Map<string, string>()
  let current = ''
  let path: string | undefined
  let groups: ProjectTreeNode[] = []

  function list() {
    const query = search.value.trim().toLocaleLowerCase()
    results.replaceChildren()

    for (const group of groups) {
      const matches = (group.children ?? []).filter((file) =>
        [group.label, file.label].some((value) => value.toLocaleLowerCase().includes(query)),
      )

      if (!matches.length) continue
      const section = document.createElement('section')

      if (group.key !== current) {
        const heading = document.createElement('h3')
        heading.textContent = group.label
        section.append(heading)
      }

      const files = document.createElement('ul')
      files.className = 'scene-list'

      for (const file of matches) {
        const row = document.createElement('li')
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = file.label
        button.setAttribute('data-inspector-link', file.key)
        button.addEventListener('click', () => visit(file.key))
        row.append(button)
        files.append(row)
      }

      section.append(files)
      results.append(section)
    }

    if (!results.children.length) results.textContent = t('tree.noResults')
  }

  search.addEventListener('input', () => {
    queries.set(current, search.value)
    list()
  })

  return {
    id: 'data-directory',
    role: 'primary',
    matches: ({ node }) =>
      node.section === 'data' && (node.kind === 'section' || node.kind === 'data-group'),
    setVisible: (visible) => {
      root.hidden = !visible
    },
    render(state) {
      if (state.path !== path) queries.clear()
      path = state.path
    },
    activate({ node, view }) {
      if (!view) return
      current = node.key
      caption.textContent = t('data.searchFiles')
      search.value = queries.get(current) ?? ''
      groups = dataFilesSection
        .nodes(view, t)
        .filter((group) => node.kind === 'section' || group.key === node.key)
      list()
    },
  }
}
