export function median(values: number[]): number {
  const copy = [...values]
  copy.sort()

  if (copy.length === 0) {
    return 0
  }

  const half = Math.floor(copy.length / 2)
  if (copy.length % 2) {
    return copy[half]
  }
  return (copy[half - 1] + copy[half]) / 2.0
}
