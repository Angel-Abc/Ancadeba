import { createElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EditorApp } from '../EditorApp'

describe('editor-ui', () => {
  it('renders EditorApp without crashing', () => {
    // Arrange
    const element = createElement(EditorApp)

    // Act
    const { container } = render(element)

    // Assert
    expect(container).toBeInTheDocument()
  })
})
