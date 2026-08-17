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
import { roundTo2 } from '../../lib/formatNumber'
import { fallbackJobColor, JOB_COLOR_PALETTE, nextUnusedColor } from '../../lib/jobColors'
import type { Job, JobPayRule } from '../../types/api'

function formatRate(rate: string | null | undefined): string {
  return rate ? String(roundTo2(rate)) : ''
}

interface JobFormValues {
  name: string
  employer_type: 'award' | 'cash'
  state: string
  color: string
  custom_weekday_rate: string
  custom_saturday_rate: string
  custom_sunday_rate?: string
  custom_public_holiday_rate?: string
  effective_from: string
}

const jobSchema = z.object({
  name: z.string().min(1, '請輸入工作名稱'),
  employer_type: z.enum(['award', 'cash']),
  state: z.string().min(2, '請輸入州別,如 NSW'),
  color: z.string().min(1, '請選擇顏色標籤'),
  custom_weekday_rate: z.string().min(1, '請輸入平日時薪'),
  custom_saturday_rate: z.string().min(1, '請輸入週六時薪'),
  custom_sunday_rate: z.string().optional(),
  custom_public_holiday_rate: z.string().optional(),
  effective_from: z.string().min(1, '請選擇生效日期'),
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
  const { data: allJobs } = useJobs()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: job
      ? {
          name: job.name,
          employer_type: job.employer_type,
          state: job.state,
          color: job.color ?? fallbackJobColor(job.id),
          custom_weekday_rate: formatRate(currentRule?.custom_weekday_rate),
          custom_saturday_rate: formatRate(currentRule?.custom_saturday_rate),
          custom_sunday_rate: formatRate(currentRule?.custom_sunday_rate),
          custom_public_holiday_rate: formatRate(currentRule?.custom_public_holiday_rate),
          effective_from: currentRule?.effective_from ?? toIsoDate(new Date()),
        }
      : {
          employer_type: 'award',
          state: 'NSW',
          color: nextUnusedColor(allJobs?.map((j) => j.color) ?? []),
          effective_from: toIsoDate(new Date()),
        },
  })
  const selectedColor = watch('color')

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    const {
      custom_weekday_rate,
      custom_saturday_rate,
      custom_sunday_rate,
      custom_public_holiday_rate,
      effective_from,
      ...jobFields
    } = values

    try {
      if (job) {
        await updateJob.mutateAsync(jobFields)
        const ratePayload = {
          rule_type: 'custom' as const,
          preset_id: null,
          custom_weekday_rate,
          custom_saturday_rate,
          custom_sunday_rate,
          custom_public_holiday_rate,
          effective_from,
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
            effective_from,
          },
        })
      }
      onClose()
    } catch (err) {
      setSubmitError((err as Error).message)
    }
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
        <div>
          <label className="mb-1 block text-xs text-gray-500">顏色標籤</label>
          <input type="hidden" {...register('color')} />
          <div className="flex flex-wrap gap-2">
            {JOB_COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`選擇顏色 ${color}`}
                onClick={() => setValue('color', color, { shouldValidate: true })}
                className="h-7 w-7 rounded-full"
                style={{
                  backgroundColor: color,
                  outline: selectedColor === color ? '2px solid currentColor' : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
          {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>}
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
            <label className="mb-1 block text-xs text-gray-500">週日時薪(選填)</label>
            <input
              {...register('custom_sunday_rate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">國定假日時薪(選填)</label>
            <input
              {...register('custom_public_holiday_rate')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">
            生效日期 —— 這份費率從哪天開始適用,要幫更早之前的班表算薪水的話,記得選在那天之前
          </label>
          <input
            type="date"
            {...register('effective_from', { required: true })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
          />
          {errors.effective_from && (
            <p className="mt-1 text-xs text-red-600">{errors.effective_from.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {job ? '儲存變更' : '新增工作'}
        </Button>
        {submitError && <p className="text-xs text-red-600">{submitError}</p>}
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
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: job.color ?? fallbackJobColor(job.id) }}
                />
                <span>
                  <span className="font-medium">{job.name}</span>{' '}
                  <span className="text-xs text-gray-500">
                    ({job.employer_type === 'cash' ? '現金' : 'Award'} · {job.state})
                  </span>
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
