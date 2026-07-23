import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useCreateJob, useJobs, useUpdateJob } from '../../hooks/useJobs'
import { useCreateJobPayRule, useJobPayRules, useUpdateJobPayRule } from '../../hooks/useJobPayRules'
import { toIsoDate } from '../../lib/dateHelpers'
import type { Job, JobPayRule } from '../../types/api'

interface JobFormValues {
  name: string
  employer_type: 'award' | 'cash'
  state: string
  custom_weekday_rate: string
  custom_saturday_rate: string
  custom_sunday_rate: string
  custom_public_holiday_rate: string
}

const jobSchema = z.object({
  name: z.string().min(1, '請輸入工作名稱'),
  employer_type: z.enum(['award', 'cash']),
  state: z.string().min(2, '請輸入州別,如 NSW'),
  custom_weekday_rate: z.string().min(1, '請輸入平日時薪'),
  custom_saturday_rate: z.string().min(1, '請輸入週六時薪'),
  custom_sunday_rate: z.string().min(1, '請輸入週日時薪'),
  custom_public_holiday_rate: z.string().min(1, '請輸入公眾假日時薪'),
})

function JobFormModal({
  job,
  currentRule,
  onClose,
}: {
  job: Job | null
  currentRule: JobPayRule | null
  onClose: () => void
}) {
  const createJob = useCreateJob()
  const updateJob = useUpdateJob(job?.id ?? 0)
  const createRule = useCreateJobPayRule()
  const updateRule = useUpdateJobPayRule()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: job
      ? {
          name: job.name,
          employer_type: job.employer_type,
          state: job.state,
          custom_weekday_rate: currentRule?.custom_weekday_rate ?? '',
          custom_saturday_rate: currentRule?.custom_saturday_rate ?? '',
          custom_sunday_rate: currentRule?.custom_sunday_rate ?? '',
          custom_public_holiday_rate: currentRule?.custom_public_holiday_rate ?? '',
        }
      : { employer_type: 'award', state: 'NSW' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const {
      custom_weekday_rate,
      custom_saturday_rate,
      custom_sunday_rate,
      custom_public_holiday_rate,
      ...jobFields
    } = values

    if (job) {
      await updateJob.mutateAsync(jobFields)
      const ratePayload = {
        rule_type: 'custom' as const,
        preset_id: null,
        custom_weekday_rate,
        custom_saturday_rate,
        custom_sunday_rate,
        custom_public_holiday_rate,
        effective_from: currentRule?.effective_from ?? toIsoDate(new Date()),
      }
      if (currentRule) {
        await updateRule.mutateAsync({ ruleId: currentRule.id, payload: ratePayload })
      } else {
        await createRule.mutateAsync({ jobId: job.id, payload: ratePayload })
      }
    } else {
      const newJob = await createJob.mutateAsync(jobFields)
      await createRule.mutateAsync({
        jobId: newJob.id,
        payload: {
          rule_type: 'custom',
          custom_weekday_rate,
          custom_saturday_rate,
          custom_sunday_rate,
          custom_public_holiday_rate,
          effective_from: toIsoDate(new Date()),
        },
      })
    }
    onClose()
  })

  return (
    <Modal title={job ? '編輯工作' : '新增工作'} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs text-gray-500">工作名稱</label>
          <input
            {...register('name')}
            placeholder="例如 Cafe A"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">薪資類型</label>
            <select
              {...register('employer_type')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            >
              <option value="award">Award(照官方費率,如咖啡廳)</option>
              <option value="cash">現金(不算稅,自己談的價錢)</option>
            </select>
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs text-gray-500">州別</label>
            <input
              {...register('state')}
              placeholder="如 NSW"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">平日時薪</label>
            <input
              {...register('custom_weekday_rate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            {errors.custom_weekday_rate && (
              <p className="mt-1 text-xs text-red-600">{errors.custom_weekday_rate.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">週六時薪</label>
            <input
              {...register('custom_saturday_rate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            {errors.custom_saturday_rate && (
              <p className="mt-1 text-xs text-red-600">{errors.custom_saturday_rate.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">週日時薪</label>
            <input
              {...register('custom_sunday_rate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            {errors.custom_sunday_rate && (
              <p className="mt-1 text-xs text-red-600">{errors.custom_sunday_rate.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">公眾假日時薪</label>
            <input
              {...register('custom_public_holiday_rate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
            {errors.custom_public_holiday_rate && (
              <p className="mt-1 text-xs text-red-600">{errors.custom_public_holiday_rate.message}</p>
            )}
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {job ? '儲存變更' : '新增工作'}
        </Button>
      </form>
    </Modal>
  )
}

export function JobsPage() {
  const { data: jobs, isLoading } = useJobs()
  const [showAdd, setShowAdd] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const { data: editingRules } = useJobPayRules(editingJob?.id ?? 0)
  const currentRule = editingRules?.find((rule) => rule.effective_to === null) ?? null

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-dusk dark:text-white">工作管理</h1>

      <Card
        title="工作列表"
        actions={
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-md bg-shamrock px-2 py-1 text-xs text-white hover:brightness-90"
          >
            + 新增工作
          </button>
        }
      >
        {isLoading && <p className="text-sm text-gray-500">載入中...</p>}
        {jobs?.length === 0 && !isLoading && (
          <p className="text-sm text-gray-500">還沒有工作,點右上角新增一個</p>
        )}
        <div className="flex flex-col">
          {jobs?.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between border-b border-gray-100 px-2 py-3 text-sm last:border-b-0 dark:border-gray-700/50"
            >
              <div>
                <span className="font-medium">{job.name}</span>{' '}
                <span className="text-xs text-gray-500">
                  ({job.employer_type === 'cash' ? '現金' : 'Award'} · {job.state})
                </span>
              </div>
              <button
                onClick={() => setEditingJob(job)}
                aria-label="編輯工作"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✏️
              </button>
            </div>
          ))}
        </div>
      </Card>

      {showAdd && <JobFormModal job={null} currentRule={null} onClose={() => setShowAdd(false)} />}
      {editingJob && editingRules !== undefined && (
        <JobFormModal job={editingJob} currentRule={currentRule} onClose={() => setEditingJob(null)} />
      )}
    </div>
  )
}
