import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { addDays, eachDayOfInterval } from 'date-fns'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TimeSelect } from '../../components/ui/TimeSelect'
import { useCreateShift } from '../../hooks/useShifts'
import { useJobs } from '../../hooks/useJobs'
import { parseIsoDate, toIsoDate } from '../../lib/dateHelpers'
import type { ShiftCreate } from '../../types/api'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const MAX_RECURRING_SHIFTS = 200

function weekdayIndex(date: Date): number {
  const jsDay = date.getDay() // 0=Sun..6=Sat
  return jsDay === 0 ? 6 : jsDay - 1 // convert to our 0=Mon..6=Sun
}

export function ShiftFormDrawer({ weekStart, onClose }: { weekStart: Date; onClose: () => void }) {
  const { data: jobs } = useJobs()
  const createShift = useCreateShift()
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringStart, setRecurringStart] = useState(toIsoDate(weekStart))
  const [recurringEnd, setRecurringEnd] = useState('')
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Omit<ShiftCreate, 'shift_date' | 'crosses_midnight'>>({
    defaultValues: { unpaid_break_minutes: 0 },
  })

  function toggleWeekday(i: number) {
    setSelectedWeekdays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]))
  }

  function computeTargetDates(): string[] {
    if (!isRecurring) {
      return selectedWeekdays.map((i) => toIsoDate(weekDays[i]))
    }
    if (!recurringEnd) return []
    const start = parseIsoDate(recurringStart)
    const end = parseIsoDate(recurringEnd)
    if (end < start) return []
    return eachDayOfInterval({ start, end })
      .filter((d) => selectedWeekdays.includes(weekdayIndex(d)))
      .map(toIsoDate)
  }

  const targetDates = computeTargetDates()

  return (
    <Modal title="新增班表" onClose={onClose}>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit(async (values) => {
            if (selectedWeekdays.length === 0) {
              setSelectionError('請至少選一天')
              return
            }
            if (isRecurring && !recurringEnd) {
              setSelectionError('請選擇循環結束日')
              return
            }
            const dates = computeTargetDates()
            if (isRecurring && dates.length === 0) {
              setSelectionError('結束日不能早於起始日')
              return
            }
            if (dates.length > MAX_RECURRING_SHIFTS) {
              setSelectionError(`一次最多新增 ${MAX_RECURRING_SHIFTS} 筆,請縮小日期範圍`)
              return
            }
            setSelectionError(null)
            setSubmitError(null)
            const crosses_midnight = values.end_time <= values.start_time
            const results = await Promise.allSettled(
              dates.map((shift_date) =>
                createShift.mutateAsync({
                  ...values,
                  job_id: Number(values.job_id),
                  shift_date,
                  crosses_midnight,
                }),
              ),
            )
            const failedCount = results.filter((r) => r.status === 'rejected').length
            if (failedCount > 0) {
              setSubmitError(`有 ${failedCount} 天新增失敗,請檢查後重試`)
            } else {
              onClose()
            }
          })}
        >
          <select
            {...register('job_id', { required: true, valueAsNumber: true })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">選擇工作</option>
            {jobs?.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            循環週期(固定班表,同樣的星期重複一段時間)
          </label>

          {isRecurring && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="sm:flex-1">
                <label className="mb-1 block text-xs text-gray-500">起始日</label>
                <input
                  type="date"
                  value={recurringStart}
                  onChange={(e) => setRecurringStart(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
              <div className="sm:flex-1">
                <label className="mb-1 block text-xs text-gray-500">結束日</label>
                <input
                  type="date"
                  value={recurringEnd}
                  onChange={(e) => setRecurringEnd(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-gray-500">
              {isRecurring ? '每週固定哪幾天(可複選)' : '套用到哪幾天(可複選)'}
            </label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((date, i) => {
                const checked = selectedWeekdays.includes(i)
                return (
                  <label
                    key={i}
                    className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-md border px-2 py-2 text-xs ${
                      checked
                        ? 'border-glaucous bg-wisteria/15 text-glaucous dark:text-wisteria'
                        : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWeekday(i)}
                      className="sr-only"
                    />
                    <span>週{WEEKDAY_LABELS[i]}</span>
                    {!isRecurring && <span>{toIsoDate(date).slice(5)}</span>}
                  </label>
                )
              })}
            </div>
            {selectionError && <p className="mt-1 text-xs text-red-600">{selectionError}</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="sm:flex-1">
              <label className="mb-1 block text-xs text-gray-500">上班時間</label>
              <Controller
                name="start_time"
                control={control}
                rules={{ required: true }}
                render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} />}
              />
            </div>
            <div className="sm:flex-1">
              <label className="mb-1 block text-xs text-gray-500">下班時間</label>
              <Controller
                name="end_time"
                control={control}
                rules={{ required: true }}
                render={({ field }) => <TimeSelect value={field.value} onChange={field.onChange} />}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">無薪休息(分鐘)</label>
            <input
              type="number"
              {...register('unpaid_break_minutes', { valueAsNumber: true })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <select
            {...register('day_type_override')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">自動判斷日期類型</option>
            <option value="weekday">強制設為平日</option>
            <option value="saturday">強制設為週六</option>
            <option value="sunday">強制設為週日</option>
            <option value="public_holiday">強制設為國定假日</option>
          </select>
          <Button type="submit" disabled={isSubmitting}>
            儲存班表{targetDates.length > 1 ? `(${targetDates.length} 天)` : ''}
          </Button>
          {submitError && <p className="text-xs text-red-600">{submitError}</p>}
        </form>
    </Modal>
  )
}
