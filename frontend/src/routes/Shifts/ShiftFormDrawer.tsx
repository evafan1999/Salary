import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { addDays } from 'date-fns'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TimeSelect } from '../../components/ui/TimeSelect'
import { useCreateShift } from '../../hooks/useShifts'
import { useJobs } from '../../hooks/useJobs'
import { toIsoDate } from '../../lib/dateHelpers'
import type { ShiftCreate } from '../../types/api'

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']

export function ShiftFormDrawer({ weekStart, onClose }: { weekStart: Date; onClose: () => void }) {
  const { data: jobs } = useJobs()
  const createShift = useCreateShift()
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const [selectedDates, setSelectedDates] = useState<string[]>([])
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

  function toggleDate(iso: string) {
    setSelectedDates((prev) => (prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso]))
  }

  return (
    <Modal title="新增班表" onClose={onClose}>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit(async (values) => {
            if (selectedDates.length === 0) {
              setSelectionError('請至少選一天')
              return
            }
            setSelectionError(null)
            setSubmitError(null)
            const crosses_midnight = values.end_time <= values.start_time
            const results = await Promise.allSettled(
              selectedDates.map((shift_date) =>
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
          <div>
            <label className="mb-1 block text-xs text-gray-500">套用到哪幾天(可複選)</label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((date, i) => {
                const iso = toIsoDate(date)
                const checked = selectedDates.includes(iso)
                return (
                  <label
                    key={iso}
                    className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-md border px-2 py-2 text-xs ${
                      checked
                        ? 'border-glaucous bg-wisteria/15 text-glaucous dark:text-wisteria'
                        : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleDate(iso)} className="sr-only" />
                    <span>週{WEEKDAY_LABELS[i]}</span>
                    <span>{toIsoDate(date).slice(5)}</span>
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
            儲存班表{selectedDates.length > 1 ? `(${selectedDates.length} 天)` : ''}
          </Button>
          {submitError && <p className="text-xs text-red-600">{submitError}</p>}
        </form>
    </Modal>
  )
}
