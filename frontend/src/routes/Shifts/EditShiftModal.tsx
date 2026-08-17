import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { TimeSelect } from '../../components/ui/TimeSelect'
import { useUpdateShift } from '../../hooks/useShifts'
import { useJobs } from '../../hooks/useJobs'
import type { Shift, ShiftUpdate } from '../../types/api'

interface EditShiftFormValues {
  job_id: number
  shift_date: string
  start_time: string
  end_time: string
  unpaid_break_minutes: number
  day_type_override: string
}

export function EditShiftModal({ shift, onClose }: { shift: Shift; onClose: () => void }) {
  const { data: jobs } = useJobs()
  const updateShift = useUpdateShift(shift.id)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EditShiftFormValues>({
    defaultValues: {
      job_id: shift.job_id,
      shift_date: shift.shift_date,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      unpaid_break_minutes: shift.unpaid_break_minutes,
      day_type_override: shift.day_type_override ?? '',
    },
  })

  return (
    <Modal title="編輯班表" onClose={onClose}>
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(async (values) => {
          setSubmitError(null)
          const crosses_midnight = values.end_time <= values.start_time
          try {
            await updateShift.mutateAsync({
              job_id: Number(values.job_id),
              shift_date: values.shift_date,
              start_time: values.start_time,
              end_time: values.end_time,
              unpaid_break_minutes: values.unpaid_break_minutes,
              day_type_override: (values.day_type_override || null) as ShiftUpdate['day_type_override'],
              crosses_midnight,
            })
            onClose()
          } catch (err) {
            setSubmitError((err as Error).message)
          }
        })}
      >
        <div>
          <label className="mb-1 block text-xs text-gray-500">工作</label>
          <select
            {...register('job_id', { required: true, valueAsNumber: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            {jobs?.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">日期</label>
          <input
            type="date"
            {...register('shift_date', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
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
          儲存變更
        </Button>
        {submitError && <p className="text-xs text-red-600">{submitError}</p>}
      </form>
    </Modal>
  )
}
