export function ProgressBar({
  label,
  subtitle,
  percent,
  colorClass = 'bg-blue-600',
}: {
  label: string
  subtitle?: string
  percent: number
  colorClass?: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>{label}</span>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}
