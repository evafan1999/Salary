const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '15', '30', '45']

export function TimeSelect({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string) => void
}) {
  const [hour, minute] = value ? value.split(':') : ['', '']

  return (
    <div className="flex gap-2">
      <select
        value={hour}
        onChange={(e) => onChange(`${e.target.value}:${minute || '00'}`)}
        className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
      >
        <option value="">時</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <select
        value={minute}
        onChange={(e) => onChange(`${hour || '00'}:${e.target.value}`)}
        className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
      >
        <option value="">分</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
