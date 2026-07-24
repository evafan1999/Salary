export function roundTo2(value: string | number): number {
  return Number(Number(value).toFixed(2))
}
