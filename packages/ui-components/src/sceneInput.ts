import {
  InputController,
  type EngineMessages,
  type InputData,
  type MapDirection,
  type SceneKeyBindings,
} from '@ancadeba/game-runtime'
import { defaultSceneKeys, sceneControlSchema } from '@ancadeba/schemas'
import { MessageBus, ScheduledMessageBus } from '@ancadeba/utilities'
import type { RenderedComponent } from './componentRendering.js'
import { bindKeyboardInput, type KeyboardInputSink } from './keyboardInput.js'
import { createBrowserTiming } from './browserTiming.js'

const directions = new Map<string, MapDirection>([
  ['map.north', 'north'],
  ['map.east', 'east'],
  ['map.south', 'south'],
  ['map.west', 'west'],
])

export function bindSceneInput(
  input: KeyboardInputSink | undefined,
  maps: readonly RenderedComponent[],
  surface: HTMLElement,
  toggleMenu?: () => void,
  overrides?: InputData['sceneKeys'],
) {
  const document = surface.ownerDocument

  if (!maps.length && !toggleMenu) return

  const keyboard = new Map<string, string>()
  const preferred = new Set<string>()

  for (const control of sceneControlSchema.options) {
    if (control === 'menu.toggle' ? !toggleMenu : !maps.length) continue
    const code = overrides?.[control] ?? defaultSceneKeys[control]
    keyboard.set(code, control)

    if (code !== defaultSceneKeys[control]) preferred.add(code)
  }

  const bindings: SceneKeyBindings = {
    keyboard,
    preferred,
    ...(keyboard.get('Escape') === 'menu.toggle' && { reserved: new Set(['Escape']) }),
    capture(id) {
      if (id === 'menu.toggle') return toggleMenu
      const direction = directions.get(id)

      if (!direction || !maps.length) return
      const target = maps.find((map) => map.element.contains(document.activeElement)) ?? maps[0]!

      return () => target.moveMap!(direction)
    },
  }

  if (input?.bindSceneKeys) return input.bindSceneKeys(bindings)

  // A scene can also be mounted directly, without an engine session.
  if (!document.defaultView) return

  const messages = new ScheduledMessageBus(
    new MessageBus<EngineMessages>(),
    createBrowserTiming(document.defaultView).scheduler,
    (error) => {
      throw error
    },
  )

  const localInput = new InputController(undefined, messages)
  localInput.bindSceneKeys(bindings)
  const unbindKeyboard = bindKeyboardInput(surface, localInput)

  return () => {
    unbindKeyboard()
    localInput.dispose()
    messages.seal()
  }
}
