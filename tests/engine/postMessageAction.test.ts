import { describe, it, expect, vi } from 'vitest'
import { PostMessageAction } from '@actions/postMessageAction'
import type { IMessageBus } from '@utils/messageBus'
import type { PostMessageAction as PostMessageActionData } from '@loader/data/action'

describe('PostMessageAction', () => {
  it('posts the specified message to the message bus', () => {
    const postMessage = vi.fn()
    const messageBus = { postMessage } as unknown as IMessageBus
    const action = new PostMessageAction(messageBus)
    const data: PostMessageActionData = {
      type: 'post-message',
      message: 'test-message',
      payload: { foo: 'bar' }
    }

    action.handle(data)

    expect(postMessage).toHaveBeenCalledWith({ message: 'test-message', payload: { foo: 'bar' } })
  })
})
