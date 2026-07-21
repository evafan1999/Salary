import { useState } from 'react'
import { addWeeks } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useShifts, useDeleteShift } from '../../hooks/useShifts'
import { useJobs } from '../../hooks/useJobs'
import { getWeekRange, toIsoDate, formatDisplayDate } from '../../lib/dateHelpers'
import { ShiftFormDrawer } from './ShiftFormDrawer'

export function ShiftsWeeklyPage() {
  const [anchor, setAnchor] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const { start, end } = getWeekRange(anchor)
  const { data: shifts, isLoading } = useShifts({
    start_date: toIsoDate(start),
    end_date: toIsoDate(end),
  })
  const { data: jobs } = useJobs()
  const deleteShift = useDeleteShift()

  const jobName = (jobId: number) => jobs?.find((j) => j.id === jobId)?.name ?? `Job #${jobId}`

  const totalGrossPay = shifts?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">班表</h1>
        <Button onClick={() => setShowForm(true)}>+ 新增班表</Button>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setAnchor(addWeeks(anchor, -1))}>
          ← 上週
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {formatDisplayDate(start)} - {formatDisplayDate(end)}
        </span>
        <Button variant="secondary" onClick={() => setAnchor(addWeeks(anchor, 1))}>
          下週 →
        </Button>
      </div>

      <Card title={`本週總收入: $${totalGrossPay.toFixed(2)}`}>
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        <div className="flex flex-col gap-2">
          {shifts?.length === 0 && <p className="text-sm text-gray-500">這週還沒有班表</p>}
          {shifts?.map((shift) => (
            <div
              key={shift.id}
              className="flex items-center justify-between rounded-md border border-gray-200 p-2 text-sm dark:border-gray-700"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {shift.shift_date} · {jobName(shift.job_id)}
                </p>
                <p className="text-xs text-gray-500">
                  {shift.start_time}–{shift.end_time} · {shift.worked_hours}h ·{' '}
                  {shift.resolved_day_type}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ${Number(shift.gross_pay).toFixed(2)}
                </span>
                <button
                  onClick={() => deleteShift.mutate(shift.id)}
                  className="text-xs text-red-500"
                >
                  刪除
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showForm && (
        <ShiftFormDrawer defaultDate={toIsoDate(new Date())} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
