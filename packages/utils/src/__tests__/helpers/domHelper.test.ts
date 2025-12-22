import { describe, expect, it } from 'vitest'
import { DomHelper } from '../../helpers/domHelper'

describe('helpers/domHelper', () => {
  it('sets the document title', () => {
    const document = { title: '' } as Document
    const helper = new DomHelper(document)

    helper.setTitle('Test Title')

    expect(document.title).toBe('Test Title')
  })
})
