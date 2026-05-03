export interface ISurfaceDataStorage {
  set surfaceId(value: string)
  get surfaceId(): string
  get currentSurfaceId(): string | null
}
