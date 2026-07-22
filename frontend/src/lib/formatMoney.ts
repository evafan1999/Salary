const formatter = new Intl.NumberFormat('en-AU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0.00'
  return formatter.format(Number(value))
}
