/**
 * Creates a two-dimensional array (matrix) with the specified dimensions.
 *
 * @param rows - Number of rows in the matrix.
 * @param columns - Number of columns in the matrix.
 * @param initialValue - Value used to initialize each cell. Objects are assigned by reference.
 * @returns A matrix represented as an array of row arrays.
 *
 * Useful for grid-based layouts or board representations. Be mindful that using
 * large dimensions may incur significant memory allocations, and mutable object
 * values will be shared across cells unless cloned.
 */
export function create2DArray<T>(rows: number, columns: number, initialValue: T): T[][] {
  return Array.from({ length: rows }, () =>
    Array(columns).fill(initialValue) as T[]
  )
}
