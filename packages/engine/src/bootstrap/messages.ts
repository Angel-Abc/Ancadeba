export const MESSAGE_ENGINE_BOOT_SURFACE_PRELOADED =
  'engine/bootstrap/bootSurfacePreloaded'

export const MESSAGE_ENGINE_PROGRESS = 'engine/bootstrap/progress'
export interface IEngineProgressPayload {
  message: string
  progress: number
}
