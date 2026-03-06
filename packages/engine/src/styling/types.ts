export interface IGameStyleLoader {
  loadStyles(stylePaths: readonly string[]): Promise<void>
}
