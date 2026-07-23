export function resolveSnapshotArray<T>(value: T[] | undefined, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}
