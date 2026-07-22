import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useCreateShift } from '../../hooks/useShifts'
import { useJobs } from '../../hooks/useJobs'
import type { ShiftCreate } from '../../types/api'

export function ShiftFormDrawer({ defaultDate, onClose }: { defaultDate: string; onClose: () => void }) {
  const { data: jobs } = useJobs()
  const createShift = useCreateShift()
  const {
    register,
    handleSubmit,
  } = useForm<ShiftCreate>({
    defaultValues: { shift_date: defaultDate, crosses_midnight: false, unpaid_break_minutes: 0 },
  })

  return (
    <Modal title="新增班表" onClose={onClose}>
        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit((values) => {
            createShift.mutate(
              { ...values, job_id: Number(values.job_id) },
              { onSuccess: onClose },
            )
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
          <input
            type="date"
            {...register('shift_date', { required: true })}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <div className="flex gap-2">
            <input
              type="time"
              {...register('start_time', { required: true })}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            <input
              type="time"
              {...register('end_time', { required: true })}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" {...register('crosses_midnight')} />
            跨午夜(隔天結束)
          </label>
          <input
            type="number"
            {...register('unpaid_break_minutes', { valueAsNumber: true })}
            placeholder="無薪休息(分鐘)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          <select
            {...register('day_type_override')}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">自動判斷日期類型</option>
            <option value="weekday">強制設為平日</option>
            <option value="saturday">強制設為週六</option>
            <option value="sunday">強制設為週日</option>
            <option value="public_holiday">強制設為公眾假日</option>
          </select>
          <Button type="submit" disabled={createShift.isPending}>
            儲存班表
          </Button>
          {createShift.isError && (
            <p className="text-xs text-red-600">{(createShift.error as Error).message}</p>
          )}
        </form>
    </Modal>
  )
}
