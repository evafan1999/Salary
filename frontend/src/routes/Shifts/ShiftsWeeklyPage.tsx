import { useState } from 'react'
import { addWeeks } from 'date-fns'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useShifts, useDeleteShift } from '../../hooks/useShifts'
import { useJobs } from '../../hooks/useJobs'
import { getWeekRange, toIsoDate, formatDisplayDate } from '../../lib/dateHelpers'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ShiftFormDrawer } from './ShiftFormDrawer'
import type { Shift } from '../../types/api'

function isShiftOver(shift: Shift, now: Date): boolean {
  const end = new Date(`${shift.shift_date}T${shift.end_time}`)
  if (shift.crosses_midnight) {
    end.setDate(end.getDate() + 1)
  }
  return end <= now
}

function ShiftRow({
  shift,
  jobName,
  isOver,
  confirmingDelete,
  onDeleteClick,
  onCancelDelete,
  onConfirmDelete,
}: {
  shift: Shift
  jobName: string
  isOver: boolean
  confirmingDelete: boolean
  onDeleteClick: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  const { format } = useCurrency()

  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-2 py-3 text-sm last:border-b-0 dark:border-gray-700/50">
      <div className={isOver ? 'text-gray-400 line-through decoration-gray-400 dark:text-gray-500' : ''}>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          {shift.shift_date} · {jobName}
        </p>
        <p className="text-xs text-gray-500">
          {shift.start_time}–{shift.end_time} · {shift.worked_hours}h · {shift.resolved_day_type}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {!confirmingDelete && (
          <>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {format(shift.gross_pay)}
            </span>
            <button onClick={onDeleteClick} className="text-xs text-red-500">
              刪除
            </button>
          </>
        )}
        {confirmingDelete && (
          <>
            <span className="text-xs text-gray-500">確定刪除這筆班表?</span>
            <button
              onClick={onConfirmDelete}
              className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:brightness-90"
            >
              確定
            </button>
            <button
              onClick={onCancelDelete}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            >
              取消
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function ShiftsWeeklyPage() {
  const [anchor, setAnchor] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const { start, end } = getWeekRange(anchor)
  const { data: shifts, isLoading } = useShifts({
    start_date: toIsoDate(start),
    end_date: toIsoDate(end),
  })
  const { data: jobs } = useJobs()
  const deleteShift = useDeleteShift()
  const { format } = useCurrency()

  const jobName = (jobId: number) => jobs?.find((j) => j.id === jobId)?.name ?? `Job #${jobId}`

  const totalGrossPay = shifts?.reduce((sum, s) => sum + Number(s.gross_pay), 0) ?? 0
  const totalWorkedHours = shifts?.reduce((sum, s) => sum + Number(s.worked_hours), 0) ?? 0

  const now = new Date()
  const orderedShifts = shifts
    ? [...shifts].sort((a, b) => Number(isShiftOver(a, now)) - Number(isShiftOver(b, now)))
    : shifts

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-dusk dark:text-white">班表</h1>
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

      <Card title={`本週總收入: ${format(totalGrossPay)} · 總時數: ${totalWorkedHours.toFixed(1)}h`}>
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        <div className="flex flex-col">
          {shifts?.length === 0 && <p className="text-sm text-gray-500">這週還沒有班表</p>}
          {orderedShifts?.map((shift) => (
            <ShiftRow
              key={shift.id}
              shift={shift}
              jobName={jobName(shift.job_id)}
              isOver={isShiftOver(shift, now)}
              confirmingDelete={confirmDeleteId === shift.id}
              onDeleteClick={() => setConfirmDeleteId(shift.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onConfirmDelete={() => {
                deleteShift.mutate(shift.id)
                setConfirmDeleteId(null)
              }}
            />
          ))}
        </div>
      </Card>

      {showForm && <ShiftFormDrawer weekStart={start} onClose={() => setShowForm(false)} />}
    </div>
  )
}
