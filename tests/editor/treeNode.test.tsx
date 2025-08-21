// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { services } from '../app/testUtils'
import { TreeNode } from '../../packages/editor/app/treeNode'
import { messageBusToken, type IMessageBus } from '@utils/messageBus'
import { SET_EDITOR_CONTENT } from '../../packages/editor/messages/editor'
import type { GameItemTreeNode } from '../../packages/editor/providers/editTreeProvider'
import { afterEach } from 'vitest'

const createNode = (): GameItemTreeNode => ({
    label: 'parent',
    children: [{ label: 'child', children: [], isCollapsed: false, data: null, level: 1 }],
    isCollapsed: false,
    data: null,
    level: 0
})

describe('TreeNode', () => {
    beforeEach(() => services.clear())
    afterEach(() => cleanup())

    it('toggles collapse state without mutating node', async () => {
        const node = createNode()
        const messageBus = { postMessage: vi.fn() } as unknown as IMessageBus
        services.set(messageBusToken, messageBus)

        render(<TreeNode node={node} />)

        const toggleButton = screen.getByRole('button', { name: 'toggle' })
        expect(screen.queryByText('child')).not.toBeNull()

        fireEvent.click(toggleButton)
        expect(screen.queryByText('child')).toBeNull()
        expect(node.isCollapsed).toBe(false)

        fireEvent.click(toggleButton)
        expect(screen.queryByText('child')).not.toBeNull()
        expect(node.isCollapsed).toBe(false)
    })

    it('posts selection message without mutating node', async () => {
        const node = createNode()
        const postMessage = vi.fn()
        services.set(messageBusToken, { postMessage } as unknown as IMessageBus)

        render(<TreeNode node={node} />)

        const selectButton = screen.getByRole('button', { name: 'parent' })
        fireEvent.click(selectButton)

        expect(postMessage).toHaveBeenCalledWith({
            message: SET_EDITOR_CONTENT,
            payload: { label: 'parent', level: 0, data: null }
        })
        expect(node.isCollapsed).toBe(false)
    })
})

