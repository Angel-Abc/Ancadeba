export function create2DArray<T>(rows: number, columns: number, initialValue: T): T[][] {
  return Array.from({ length: rows }, () =>
    Array(columns).fill(initialValue) as T[]
  )
}
